import { useEffect, useState } from 'react'
import { ccc } from '@ckb-ccc/ccc'
import { useCcc, useSigner } from '@ckb-ccc/connector-react'
import './App.css'

function App() {
  // CCC wallet connection
  const { open, disconnect, wallet } = useCcc()

  // Get the currently connected wallet signer
  const signer = useSigner()

  // Network / wallet information
  const [network, setNetwork] = useState('Loading...')
  const [address, setAddress] = useState('Not connected')
  const [balance, setBalance] = useState('--')

  // Transfer form
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')

  // Transaction status
  const [txStatus, setTxStatus] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)

  // Detect CKB Testnet
  useEffect(() => {
    const client = new ccc.ClientPublicTestnet()

    setNetwork(
      client.addressPrefix === 'ckt'
        ? 'CKB Testnet'
        : 'Unknown',
    )
  }, [])

  // Load wallet address and balance after connecting
  useEffect(() => {
    const loadWalletInfo = async () => {
      if (!signer) {
        setAddress('Not connected')
        setBalance('--')
        return
      }

      try {
        const addr = await signer.getRecommendedAddress()
        setAddress(addr)

        const balanceValue = await signer.getBalance()

        setBalance(
          ccc.fixedPointToString(balanceValue),
        )
      } catch (error) {
        console.error(
          'Failed to load wallet information:',
          error,
        )
      }
    }

    loadWalletInfo()
  }, [signer])

  // Build a CKB transfer transaction
  const handleBuildTransaction = async () => {
    if (!signer) {
      setTxStatus('Please connect a wallet first.')
      return
    }

    if (!receiver.trim()) {
      setTxStatus('Please enter a receiver address.')
      return
    }

    if (!amount.trim()) {
      setTxStatus('Please enter an amount.')
      return
    }

    try {
      setIsBuilding(true)
      setTxStatus('Building transaction...')

      // Convert receiver address into a CKB lock script
      const { script: lock } = await ccc.Address.fromString(
        receiver.trim(),
        signer.client,
      )

      // Create a transaction with one CKB output
      const tx = ccc.Transaction.from({
        outputs: [
          {
            capacity: ccc.fixedPointFrom(amount.trim()),
            lock,
          },
        ],
      })

      // Automatically select input cells
      await tx.completeInputsByCapacity(signer)

      // Calculate and add the transaction fee
      await tx.completeFeeBy(signer)

      setTxStatus(
        `Transaction completed successfully. ` +
        `Inputs: ${tx.inputs.length}, ` +
        `Outputs: ${tx.outputs.length}.`,
      )

      console.log('Completed transaction:', tx)
    } catch (error) {
      console.error(
        'Failed to build transaction:',
        error,
      )

      setTxStatus(
        `Failed to build transaction: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      )
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <main>
      <h1>CKB Learning dApp</h1>

      <section>
        <p>
          <strong>Network:</strong> {network}
        </p>

        <p>
          <strong>Wallet:</strong>{' '}
          {wallet ? wallet.name : 'Not connected'}
        </p>

        <p>
          <strong>Address:</strong>
          <br />
          <code>{address}</code>
        </p>

        <p>
          <strong>Balance:</strong>
          <br />
          <strong>{balance} CKB</strong>
        </p>

        {!wallet ? (
          <button onClick={open}>
            Connect Wallet
          </button>
        ) : (
          <button onClick={disconnect}>
            Disconnect
          </button>
        )}
      </section>

      <section>
        <h2>Transfer CKB</h2>

        <p>
          <strong>Receiver Address</strong>
        </p>

        <input
          type="text"
          value={receiver}
          onChange={(event) =>
            setReceiver(event.target.value)
          }
          placeholder="ckt1..."
          disabled={!signer || isBuilding}
        />

        <p>
          <strong>Amount</strong>
        </p>

        <input
          type="number"
          min="0"
          step="0.00000001"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          placeholder="100"
          disabled={!signer || isBuilding}
        />

        <br />
        <br />

        <button
          onClick={handleBuildTransaction}
          disabled={!signer || isBuilding}
        >
          {isBuilding
            ? 'Building...'
            : 'Build Transaction'}
        </button>

        {txStatus && (
          <p>
            <strong>Status:</strong>
            <br />
            {txStatus}
          </p>
        )}
      </section>
    </main>
  )
}

export default App