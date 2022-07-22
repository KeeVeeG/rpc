// @ts-nocheck
import { rpcMaster, rpcWorker } from '../'

const master = new rpcMaster()
const worker1 = new rpcWorker()
const worker2 = new rpcWorker(44442)

const sum = (a, b) => a + b

describe('main', () => {
  test('connect worker', async () => {
    const id = await master.addWorker()
    expect(worker1.sockets[id]).toBeDefined()
  })

  test('add module', async () => {
    const module = 'uuid'
    await master.addModule(module)
    expect(worker1.modules.has(module)).toBeTruthy()
  }, 10000)

  test('exec', async () => {
    const { data } = await master.exec<number>(sum, 1, 2)
    expect(data).toEqual(3)
  })

  test('get error', async () => {
    const func = () => {
      throw new Error()
    }
    const result = await master.exec(func)
    expect(result.error).toBeDefined()
  })

  test('connect one more worker', async () => {
    const id = await master.addWorker(undefined, 44442)
    expect(worker2.sockets[id]).toBeDefined()
  })

  test('call not exists func', async () => {
    const promises: Promise<any> = []
    for (let i = 0; i < 10; i++) {
      promises.push(master.exec<number>(sum, 2, 3))
    }
    const results = await Promise.all(promises)
    expect(results.every(({ data }) => data === 5)).toBeTruthy()
  })

  test('add one more module', async () => {
    const module = 'axios'
    await master.addModule(module)
    expect(worker1.modules.has(module) && worker2.modules.has(module)).toBeTruthy()
  }, 10000)

  test('exec with module', async () => {
    const func = async () => {
      const { v4 } = await import('uuid')
      return v4()
    }
    const { data } = await master.exec<string>(func)
    expect(data.length).toEqual(36)
  })

  test('exec async with module', async () => {
    const func = async (url: string) => {
      const { default: axios } = await import('axios')
      const { status } = await axios.get(url)
      return status
    }
    const { data } = await master.exec<number>(func, 'https://github.com/KeeVeeG')
    expect(data).toEqual(200)
  })
})
