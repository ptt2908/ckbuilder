import { useEffect, useState } from 'react'
import { ccc } from '@ckb-ccc/ccc'
import { useCcc, useSigner } from '@ckb-ccc/connector-react'
import './App.css'

function App() {
  // CCC wallet connection
  const { open, disconnect, wallet } = useCcc()

  // Currently connected wallet signer
  const signer = useSigner()

  // Network / wallet information
  const [network, setNetwork] = useState('Loading...')
  const [address, setAddress] = useState('Not connected')
  const [balance, setBalance] = useState('--')

  // Transfer form
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')

  // Transaction state
  const [txStatus, setTxStatus] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)

  const [txInfo, setTxInfo] = useState<{
    inputs: number
    outputs: number
    receiver: string
    amount: string
  } | null>(null)

  // Detect CKB Testnet
  useEffect(() => {
    const client = new ccc.ClientPublicTestnet()

    setNetwork(
      client.addressPrefix === 'ckt'
        ? 'CKB Testnet'
        : 'Unknown',
    )
  }, [])

  // Load wallet address and balance
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
    setTxStatus('')
    setTxInfo(null)

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

      // Convert receiver address into a CKB lock script
      const client = new ccc.ClientPublicTestnet()

      const { script: lock } = await ccc.Address.fromString(
        receiver.trim(),
        client,
      )

      // Create the transaction output
      const tx = ccc.Transaction.from({
        outputs: [
          {
            capacity: ccc.fixedPointFrom(amount.trim()),
            lock,
          },
        ],
      })

      // If a wallet signer is connected,
      // complete inputs and transaction fee.
      if (signer) {
        await tx.completeInputsByCapacity(signer)
        await tx.completeFeeBy(signer)

        setTxStatus(
          'Transaction completed successfully.',
        )
      } else {
        setTxStatus(
          'Transaction skeleton created. Connect a wallet to complete inputs and fee.',
        )
      }

      // Store information for the preview
      setTxInfo({
        inputs: tx.inputs.length,
        outputs: tx.outputs.length,
        receiver: receiver.trim(),
        amount: amount.trim(),
      })

      console.log('Transaction:', tx)
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
          disabled={isBuilding}
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
          disabled={isBuilding}
        />

        <br />
        <br />

        <button
          onClick={handleBuildTransaction}
          disabled={isBuilding}
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

      {txInfo && (
        <section>
          <h2>Transaction Preview</h2>

          <p>
            <strong>Inputs:</strong>{' '}
            {txInfo.inputs}
          </p>

          <p>
            <strong>Outputs:</strong>{' '}
            {txInfo.outputs}
          </p>

          <p>
            <strong>Receiver:</strong>
            <br />
            <code>{txInfo.receiver}</code>
          </p>

          <p>
            <strong>Amount:</strong>{' '}
            {txInfo.amount} CKB
          </p>
        </section>
      )}
    </main>
  )
}

export default App