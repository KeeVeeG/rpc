import { Socket as SockerServer } from 'socket.io'
import { Socket as SockerClient } from 'socket.io-client'

type Socket = SockerServer | SockerClient

export class Abstract {
  protected sockets: {
    [key: string]: {
      socket: Socket
    }
  } = {}
  protected modules: Set<string> = new Set()
  protected functions: {
    [key: string]: Function
  } = {}

  protected removeSocket(socket: Socket) {
    delete this.sockets[socket.id]
  }

  protected onDisconnect(socket: Socket) {
    socket.on('connection_error', () => {
      this.removeSocket(socket)
    })
    socket.on('disconnecting', () => {
      this.removeSocket(socket)
    })
  }
}
