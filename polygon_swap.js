const { ethers, BigNumber } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState } = require('./helpers')
const ERC20ABI = require('./abis/abi.json')

require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET) // mumbai
const poolAddress = "0xa374094527e1673a86de625aa59517c5de346d32" // wmatic/usdc
const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

const name0 = 'Wrapped Matic'
const symbol0 = 'WMATIC'
const decimals0 = 18
const address0 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'

const name1 = 'USD Coin'
const symbol1 = 'USDC'
const decimals1 = 6
const address1 = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

async function main() {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )

  const immutables = await getPoolImmutables(poolContract)
  const state = await getPoolState(poolContract)

  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )

  const inputAmount = 1
  // .001 => 1 000 000 000 000 000
  const amountIn = ethers.utils.parseUnits(inputAmount.toString(), decimals0)
  
  const v1 = BigNumber.from(amountIn)
  const v2 = BigNumber.from(100000).toString()
  const approvalAmount = (v1.mul(v2))
  const tokenContract0 = new ethers.Contract(
    address0,
    ERC20ABI,
    provider
  )

  let gasPrice = await provider.getGasPrice() // get actual gasprice from blockchain
  gasPrice = BigNumber.from(parseInt(gasPrice * 1.1))
  gasPrice = gasPrice.toString()
  console.log(gasPrice)

  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount, {
      //gasLimit: parseInt(gasPrice), //32000000
      gasPrice: parseInt(gasPrice)
    }
  )

  const params = {
    tokenIn: immutables.token1,
    tokenOut: immutables.token0,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  const transaction = swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(1000000),
      gasPrice: parseInt(gasPrice)
    }
  ).then(transaction => {
    console.log(transaction)
  })
  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
}

main()
