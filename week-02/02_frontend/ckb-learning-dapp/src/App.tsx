import { useEffect, useState } from 'react'
import {
  getCkbNetwork,
  getTransactionStatus,
  type CkbTransactionStatus,
} from './backendApi'
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

  const [backendNetwork, setBackendNetwork] = useState('Loading...')
  const [backendTip, setBackendTip] = useState('--')
  const [backendStatus, setBackendStatus] = useState('')
  const [isCheckingBackend, setIsCheckingBackend] = useState(false)
  const [trackingTxHash, setTrackingTxHash] = useState('')
  const [trackingStatus, setTrackingStatus] =
  useState<CkbTransactionStatus | null>(null)
  const [trackingError, setTrackingError] = useState('')
  const [isTracking, setIsTracking] = useState(false)

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

  // Query Testnet Balance state
  const [queryAddress, setQueryAddress] = useState(
    'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8',
  )
  const [queriedBalance, setQueriedBalance] = useState<string | null>(null)
  const [queryStatus, setQueryStatus] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)

  // Query balance directly using CCC ClientPublicTestnet (no wallet required)
  const handleQueryBalance = async () => {
    setQueryStatus('')
    setQueriedBalance(null)

    if (!queryAddress.trim()) {
      setQueryStatus('Please enter a CKB Testnet address.')
      return
    }

    try {
      setIsQuerying(true)
      const client = new ccc.ClientPublicTestnet()
      const { script: lock } = await ccc.Address.fromString(
        queryAddress.trim(),
        client,
      )

      const balanceValue = await client.getBalance([lock])
      setQueriedBalance(ccc.fixedPointToString(balanceValue))
    } catch (error) {
      console.error('Failed to query balance:', error)
      setQueryStatus(
        `Failed to query balance: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsQuerying(false)
    }
  }

  // Query Cells state
  interface CellItem {
    id: string
    capacity: string
    hasTypeScript: boolean
    dataLength: number
  }
  const [cells, setCells] = useState<CellItem[]>([])
  const [totalCellsCount, setTotalCellsCount] = useState<number | null>(null)
  const [cellsStatus, setCellsStatus] = useState('')
  const [isQueryingCells, setIsQueryingCells] = useState(false)

  // Query live cells directly using CCC ClientPublicTestnet
  const handleQueryCells = async () => {
    setCellsStatus('')
    setCells([])
    setTotalCellsCount(null)

    if (!queryAddress.trim()) {
      setCellsStatus('Please enter a CKB Testnet address.')
      return
    }

    try {
      setIsQueryingCells(true)
      const client = new ccc.ClientPublicTestnet()
      const { script: lock } = await ccc.Address.fromString(
        queryAddress.trim(),
        client,
      )

      const fetchedCells: CellItem[] = []
      let count = 0

      for await (const cell of client.findCellsByLock(lock)) {
        count++
        if (fetchedCells.length < 10) {
          const rawDataLen = cell.outputData ? cell.outputData.length : 2
          const byteLen = Math.max(0, Math.floor((rawDataLen - 2) / 2))

          fetchedCells.push({
            id: `${cell.outPoint.txHash.slice(0, 10)}...${cell.outPoint.txHash.slice(-6)}:${cell.outPoint.index}`,
            capacity: ccc.fixedPointToString(cell.cellOutput.capacity),
            hasTypeScript: Boolean(cell.cellOutput.type),
            dataLength: byteLen,
          })
        }
      }

      setTotalCellsCount(count)
      setCells(fetchedCells)

      if (count === 0) {
        setCellsStatus('No live cells found for this address.')
      }
    } catch (error) {
      console.error('Failed to query cells:', error)
      setCellsStatus(
        `Failed to query cells: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsQueryingCells(false)
    }
  }

  // Query Transactions state
  interface TxItem {
    txHash: string
    blockNumber: string
  }
  const [transactions, setTransactions] = useState<TxItem[]>([])
  const [totalTxCount, setTotalTxCount] = useState<number | null>(null)
  const [txQueryStatus, setTxQueryStatus] = useState('')
  const [isQueryingTx, setIsQueryingTx] = useState(false)

  // Query transaction history directly using CCC ClientPublicTestnet
  const handleQueryTransactions = async () => {
    setTxQueryStatus('')
    setTransactions([])
    setTotalTxCount(null)

    if (!queryAddress.trim()) {
      setTxQueryStatus('Please enter a CKB Testnet address.')
      return
    }

    try {
      setIsQueryingTx(true)
      const client = new ccc.ClientPublicTestnet()
      const { script: lock } = await ccc.Address.fromString(
        queryAddress.trim(),
        client,
      )

      const fetchedTxs: TxItem[] = []
      let count = 0

      for await (const txRecord of client.findTransactionsByLock(
        lock,
        null,
        true,
      )) {
        count++
        if (fetchedTxs.length < 10) {
          fetchedTxs.push({
            txHash: txRecord.txHash,
            blockNumber: txRecord.blockNumber.toString(),
          })
        }
      }

      setTotalTxCount(count)
      setTransactions(fetchedTxs)

      if (count === 0) {
        setTxQueryStatus('No transactions found for this address.')
      }
    } catch (error) {
      console.error('Failed to query transactions:', error)
      setTxQueryStatus(
        `Failed to query transactions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsQueryingTx(false)
    }
  }

  const handleCheckBackend = async () => {
    setBackendStatus('')
    setIsCheckingBackend(true)

    try {
      const result = await getCkbNetwork()

      setBackendNetwork(result.network)
      setBackendTip(result.tip)
      setBackendStatus('Backend connection successful.')
    } catch (error) {
      console.error('Failed to connect to backend:', error)

      setBackendStatus(
        `Failed to connect to backend: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsCheckingBackend(false)
    }
  }

  const handleTrackTransaction = async () => {
    setTrackingError('')
    setTrackingStatus(null)

    if (!trackingTxHash.trim()) {
      setTrackingError('Please enter a transaction hash.')
      return
    }

    try {
      setIsTracking(true)

      const result = await getTransactionStatus(trackingTxHash.trim())

      setTrackingStatus(result)
    } catch (error) {
      console.error('Failed to track transaction:', error)

      setTrackingError(
        error instanceof Error
          ? error.message
          : String(error),
      )
    } finally {
      setIsTracking(false)
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
        <h2>CKB Backend</h2>

        <button
          onClick={handleCheckBackend}
          disabled={isCheckingBackend}
        >
          {isCheckingBackend ? 'Checking Backend...' : 'Check Backend'}
        </button>

        <div>
          <p>
            <strong>Backend Network:</strong> {backendNetwork}
          </p>

          <p>
            <strong>Backend Tip:</strong> {backendTip}
          </p>
        </div>

        {backendStatus && (
          <p>
            {backendStatus}
          </p>
        )}
    <section>
  <h2>Transaction Tracking</h2>

  <p>
    <strong>Transaction Hash</strong>
  </p>

  <input
    type="text"
    value={trackingTxHash}
    onChange={(event) => setTrackingTxHash(event.target.value)}
    placeholder="0x..."
    disabled={isTracking}
    style={{ width: '100%' }}
  />

  <br />
  <br />

  <button
    onClick={handleTrackTransaction}
    disabled={isTracking}
  >
    {isTracking ? 'Checking Transaction...' : 'Check Transaction Status'}
  </button>

  {trackingStatus && (
    <div>
      <p>
        <strong>Status:</strong> {trackingStatus.status}
      </p>

      <p>
        <strong>Block Number:</strong>{' '}
        {trackingStatus.blockNumber ?? 'N/A'}
      </p>

      <p>
        <strong>Transaction Index:</strong>{' '}
        {trackingStatus.txIndex ?? 'N/A'}
      </p>
    </div>
  )}

  {trackingError && (
    <p>
      <strong>Error:</strong> {trackingError}
    </p>
  )}
</section>
    </section>
      <section>
        <h2>Query Testnet Balance</h2>

        <p>
          <strong>CKB Testnet Address</strong>
        </p>

        <input
          type="text"
          value={queryAddress}
          onChange={(event) =>
            setQueryAddress(event.target.value)
          }
          placeholder="ckt1..."
          disabled={isQuerying}
          style={{ width: '100%' }}
        />

        <br />
        <br />

        <button
          onClick={handleQueryBalance}
          disabled={isQuerying}
        >
          {isQuerying ? 'Querying...' : 'Query Balance'}
        </button>

        {queriedBalance !== null && (
          <p>
            <strong>Balance:</strong>
            <br />
            <strong>{queriedBalance} CKB</strong>
          </p>
        )}

        {queryStatus && (
          <p>
            <strong>Status:</strong>
            <br />
            {queryStatus}
          </p>
        )}
      </section>

      <section>
        <h2>Query Cells</h2>

        <button
          onClick={handleQueryCells}
          disabled={isQueryingCells}
        >
          {isQueryingCells ? 'Querying Cells...' : 'Query Cells'}
        </button>

        {totalCellsCount !== null && (
          <p>
            <strong>Total Cells Found:</strong> {totalCellsCount}
            {totalCellsCount > 10 && ' (showing first 10)'}
          </p>
        )}

        {cells.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '6px 8px' }}>OutPoint</th>
                  <th style={{ padding: '6px 8px' }}>Capacity (CKB)</th>
                  <th style={{ padding: '6px 8px' }}>Type Script</th>
                  <th style={{ padding: '6px 8px' }}>Data Length</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((cell, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <code>{cell.id}</code>
                    </td>
                    <td style={{ padding: '6px 8px' }}>{cell.capacity}</td>
                    <td style={{ padding: '6px 8px' }}>
                      {cell.hasTypeScript ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{cell.dataLength} bytes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cellsStatus && (
          <p>
            <strong>Status:</strong>
            <br />
            {cellsStatus}
          </p>
        )}
      </section>

      <section>
        <h2>Query Transactions</h2>

        <button
          onClick={handleQueryTransactions}
          disabled={isQueryingTx}
        >
          {isQueryingTx ? 'Querying Transactions...' : 'Query Transactions'}
        </button>

        {totalTxCount !== null && (
          <p>
            <strong>Total Transactions Found:</strong> {totalTxCount}
            {totalTxCount > 10 && ' (showing first 10)'}
          </p>
        )}

        {transactions.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '6px 8px' }}>Transaction Hash</th>
                  <th style={{ padding: '6px 8px' }}>Block Number</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <code>{tx.txHash}</code>
                    </td>
                    <td style={{ padding: '6px 8px' }}>{tx.blockNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {txQueryStatus && (
          <p>
            <strong>Status:</strong>
            <br />
            {txQueryStatus}
          </p>
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