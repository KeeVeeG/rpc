import * as crypto from 'crypto'
import { io, Socket } from 'socket.io-client'
import { Abstract } from './abstract'

type SocketInstance = {
  socket: Socket
  modules: Set<string>
  functions: Set<string>
  process: number
}

export class rpcMaster extends Abstract {
  public sockets: {
    [key: string]: SocketInstance
  } = {}
  private operaion = 0

  constructor() {
    super()
  }

  private get _sockets() {
    return Object.values(this.sockets)
  }

  private addSocket(socket: Socket) {
    this.sockets[socket.id] = { socket, modules: new Set(), functions: new Set(), process: 0 }
  }

  public addWorker(host?: string, port?: number) {
    return new Promise<string>(resolve => {
      const socket = io((host || 'http://localhost') + ':' + (port || 44441))
      socket.on('connect', () => {
        this.addSocket(socket)
        if (this.modules.size) {
          this.modules.forEach(id => {
            socket.once('added-module-' + id, () => {
              this.sockets[socket.id].modules.add(id)
              if (this.sockets[socket.id].modules.size === this.modules.size) {
                resolve(socket.id)
              }
            })
            socket.emit('add-module', id)
          })
        } else {
          resolve(socket.id)
        }
      })
      socket.on('connect_error', error => {
        console.error(error)
      })
    })
  }

  public addModule(id: string) {
    return new Promise<void>(resolve => {
      this.modules.add(id)
      this._sockets.forEach(({ socket, modules }) => {
        socket.once('added-module-' + id, () => {
          modules.add(id)
          if (this._sockets.every(({ modules }) => modules.size === this.modules.size)) {
            resolve()
          }
        })
        socket.emit('add-module', id)
      })
    })
  }

  public exec(func: Function, ...args: any[]) {
    return new Promise<any>(resolve => {
      const source = func.toString()
      const hash = crypto.createHash('md5').update(source).digest('hex')
      if (!this.functions[hash]) {
        this.functions[hash] = func
        this._sockets.forEach(instance => {
          instance.socket.once('added-function-' + hash, () => {
            const operation = this.operaion++
            instance.socket.once('result-' + operation, result => {
              instance.process--
              resolve(result)
            })
            instance.process++
            instance.socket.emit('exec', { hash, operation, args })
          })
          instance.socket.emit('add-function', { hash, source })
        })
      } else {
        const min = this._sockets.reduce((min, { process }) => Math.min(min, process), Infinity)
        const instance = this._sockets.find(({ process }) => process === min) as SocketInstance
        const operation = this.operaion++
        instance.socket.once('result-' + operation, result => {
          instance.process--
          resolve(result)
        })
        instance.process++
        instance.socket.emit('exec', { hash, operation, args })
      }
    })
  }
}
