# Remote Procedure Call (RPC)

## Installation
```sh
$ npm install @keeveeg/rpc
```

## Master

### Create instance
```javascript
import { rpcMaster } from '@keeveeg/rpc'
const master = new rpcMaster()
```

### Add worker
```javascript
await master.addWorker('http://other-url', 44441)
```

### Exectute function
Only arrow functions supported
```javascript
const sum = (a, b) => a + b
const result = await master.exec(sum, 1, 2) // 3
```

### Install modules
```javascript
await master.addModule('axios')
```
Use dynamic import in executable function
```javascript
const func = async url => {
  const { default: axios } = await import('axios')
  const { status } = await axios.get(url)
  return status
}
const result = await master.exec(func, 'https://github.com/KeeVeeG')
```

## Worker

### Create instance on other machine
```javascript
import { rpcWorker } from '@keeveeg/rpc'
new rpcWorker(44441)
```