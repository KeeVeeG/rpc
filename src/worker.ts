import { Server, Socket } from 'socket.io'
import { execSync } from 'child_process'
import { Abstract } from './abstract'

export class rpcWorker extends Abstract {
  private io: Server

  constructor(port?: number) {
    super()
    this.io = new Server()
    this.io.on('connection', socket => {
      this.addSocket(socket)
      this.onDisconnect(socket)
      this.onAddModule(socket)
      this.onAddFunction(socket)
      this.onExec(socket)
    })
    this.io.listen(port || 44441)
  }

  private onAddModule(socket: Socket) {
    socket.on('add-module', (id: string) => {
      if (!this.modules.has(id)) {
        this.modules.add(id)
        execSync('npm i ' + id)
      }
      socket.emit('added-module-' + id)
    })
  }

  private onAddFunction(socket: Socket) {
    socket.on('add-function', ({ hash, source }) => {
      this.functions[hash] = eval(source)
      socket.emit('added-function-' + hash)
    })
  }

  private onExec(socket: Socket) {
    socket.on('exec', async ({ hash, operation, args }) => {
      let func = this.functions[hash]
      while (!func) {
        await new Promise<void>(resolve => resolve())
        func = this.functions[hash]
      }
      try {
        const data = await func(...args)
        socket.emit('result-' + operation, { data })
      } catch ({message}) {
        socket.emit('result-' + operation, { error: message })
      }
    })
  }

  private addSocket(socket: Socket) {
    this.sockets[socket.id] = { socket }
  }
}
