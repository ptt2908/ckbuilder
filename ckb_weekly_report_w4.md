# CKBuilders Week 04 Report

## 1. Overview
**Program:** CKBuilder  
**Week:** Week 4  
**Reporting Period:** 14 September - 20 September 2026  
**Participant:** Pham Tan Thinh
### Project: CKB Asset Manager

This week, I focused on building a basic CKB application using React,
TypeScript, CCC, and JoyID. The goal was to move from learning
individual CKB concepts to integrating them into one practical
application running on CKB Testnet.

The application provides a simple interface for managing CKB assets and
interacting with CKB Testnet, including wallet connection, CKB balance
and transfer, xUDT operations, Spore operations, message signing, and
transaction querying.

The Week 4 work was implemented in the `week-04` repository.

------------------------------------------------------------------------

## 2. Objectives

The main objectives for Week 4 were:

-   Connect a CKB wallet to the application using JoyID.
-   Read the wallet's CKB Testnet balance.
-   Create and manage an xUDT on CKB Testnet.
-   Query the xUDT balance and perform an xUDT transfer.
-   Create and query Spore assets.
-   Sign and verify a message using the connected JoyID wallet.
-   Query a CKB transaction by transaction hash.
-   Build these functions into one basic CKB application.

------------------------------------------------------------------------

## 3. Application

### 3.1 Technology Stack

-   React
-   TypeScript
-   Vite
-   CCC (`@ckb-ccc/ccc`)
-   CCC Connector React
-   CCC xUDT package
-   CCC Spore package
-   JoyID Passkey
-   CKB Testnet

The application uses CCC as the main interface for interacting with CKB
and JoyID as the connected wallet.

------------------------------------------------------------------------

## 4. Implementation and Results

### 4.1 JoyID Wallet Connection

The application was integrated with JoyID Passkey on CKB Testnet.

After connecting the wallet, the application displays:

-   Wallet status
-   CKB Testnet address
-   CKB balance

During setup, JoyID initially returned a
`WalletNotSupportedError: Credential not found`. Creating a new JoyID
Testnet wallet resolved the issue and allowed the application to connect
successfully.

**Result:** Wallet connection and CKB balance query were successfully
verified.

**Evidence:** `01-wallet-dashboard.png`

------------------------------------------------------------------------

### 4.2 CKB Balance and Transfer

The application supports reading the connected wallet's CKB balance and
transferring CKB to another address.

The CKB transfer flow was tested successfully on CKB Testnet.

The application also handles the minimum capacity requirement for CKB
outputs. During testing, the application displayed the required capacity
information for the recipient output.

**Result:** CKB transfer functionality was successfully tested on
Testnet.

**Evidence:** `05-ckb-transfer.png`

------------------------------------------------------------------------

### 4.3 xUDT

The Week 4 application uses a fresh xUDT on CKB Testnet rather than
reusing the xUDT from the Week 2 OffCKB Devnet environment.

The xUDT type arguments were derived from the connected wallet's lock
script. The resulting xUDT type arguments were:

``` text
0x8740099f49fe3c4a5aa42357657440de11b03bb844b1a0a75722fa38cb6c92204
```

The application supports:

-   xUDT minting
-   xUDT balance query
-   xUDT transfer

After the transfer test, the displayed balance was:

``` text
990 xUDT
```

This reflects the previously completed transfer of 10 xUDT.

**Result:** xUDT creation/minting, balance querying, and transfer were
successfully demonstrated on CKB Testnet.

**Evidence:** - `02-xudt-dashboard.png` - `04-xudt-transfer.png`

------------------------------------------------------------------------

### 4.4 Spore

The application integrates Spore functionality using CCC.

The application can:

-   Create a Spore
-   Query owned Spore assets
-   Display Spore ID
-   Display content type
-   Decode and display the Spore content

The tested Spore used:

``` text
Content Type: text/plain
Content: Hello CKBuilders Spore!
```

One issue occurred during implementation where the Spore content was
initially displayed as `Unable to decode content`. This was resolved by
converting the Spore content bytes to UTF-8 using CCC's byte conversion
utilities.

A successfully queried Spore ID was:

``` text
0x13b95e090b54b358dbd8434e24d970f53288ae93ebfab09357f38cda59022039
```

**Result:** Spore creation and querying were successfully demonstrated
on CKB Testnet.

**Evidence:** `03-spore-dashboard.png`

------------------------------------------------------------------------

### 4.5 Message Signing and Verification

A message signing feature was added to the application using the
connected JoyID wallet.

The tested message was:

``` text
Hello CKBuilders!
```

The application successfully displayed:

-   Sign Type: `JoyId`
-   Generated signature
-   Verification result: `Valid signature`

This demonstrates that the application can use the connected wallet to
sign a message and verify the resulting signature.

**Result:** Message signing and verification were successfully
completed.

**Evidence:** `06-sign-verify.png`

------------------------------------------------------------------------

### 4.6 Transaction Query

A transaction query feature was added to allow the user to enter a CKB
transaction hash and query its status from CKB Testnet.

The following Spore transaction was queried:

``` text
0xf3e6ab8b1ebe46599da02aa07352096970e1c0c6b3f358cd4e0a9890ba6440f4
```

The application returned:

``` text
Status: committed
Block: 22482472
```

This confirms that the application can retrieve transaction information
from CKB Testnet using a transaction hash.

**Result:** Transaction querying was successfully verified.

**Evidence:** `07-transaction-query.png`

------------------------------------------------------------------------

## 5. Final Application Scope

By the end of Week 4, the application included the following
functionality:

  Feature                           Result
  --------------------------------- -----------
  JoyID wallet connection           Completed
  CKB balance query                 Completed
  CKB transfer                      Completed
  xUDT mint                         Completed
  xUDT balance query                Completed
  xUDT transfer                     Completed
  Spore creation                    Completed
  Spore query and content display   Completed
  Message signing                   Completed
  Message verification              Completed
  Transaction query                 Completed

The result is a basic CKB asset management application that combines
several CKB functionalities into a single frontend application.

------------------------------------------------------------------------

## 6. Challenges and Solutions

### JoyID wallet setup

**Problem:** JoyID initially returned `Credential not found`.

**Solution:** A new JoyID wallet was created for CKB Testnet, after
which the wallet connected successfully.

### xUDT environment difference

**Problem:** The xUDT created during Week 2 was associated with the
OffCKB Devnet environment and could not be directly reused for the Week
4 Testnet application.

**Solution:** A fresh xUDT was created for the CKB Testnet environment.

### Spore content decoding

**Problem:** The Spore content was initially displayed as
`Unable to decode content`.

**Solution:** The content bytes were converted using CCC's byte
conversion utility and displayed as UTF-8 text.

### CCC Sign & Verify API

**Problem:** The first implementation used an incorrect `Signature` API.

**Solution:** The implementation was updated to use the current CCC
`Signature` structure and verification flow. The final result
successfully returned `Valid signature`.

### TypeScript build errors

**Problem:** During development, TypeScript reported errors related to
the Sign & Verify implementation.

**Solution:** The implementation was corrected and the project
successfully passed:

``` text
npm.cmd run build
```

------------------------------------------------------------------------

## 7. What I Learned

Through this week's implementation, I learned how to:

-   Use CCC to interact with CKB from a React/TypeScript application.
-   Connect a JoyID Passkey wallet to a CKB Testnet application.
-   Work with xUDT type arguments, balances, and transfers.
-   Create and query Spore assets.
-   Use wallet-based message signing and signature verification.
-   Query CKB transaction information using a transaction hash.
-   Debug TypeScript and CCC API integration issues during application
    development.
-   Integrate several CKB features into one basic application instead of
    testing each feature separately.

------------------------------------------------------------------------

## 8. Evidence

The following screenshots were captured during the Week 4
implementation:

  -----------------------------------------------------------------------
  Evidence                            Description
  ----------------------------------- -----------------------------------
  `01-wallet-dashboard.png`           JoyID wallet connection and CKB
                                      balance

  `02-xudt-dashboard.png`             xUDT type arguments, balance, and
                                      mint result

  `03-spore-dashboard.png`            Spore creation and queried Spore
                                      asset

  `04-xudt-transfer.png`              xUDT transfer result

  `05-ckb-transfer.png`               CKB transfer result

  `06-sign-verify.png`                JoyID message signing and valid
                                      signature verification

  `07-transaction-query.png`          Transaction query showing
                                      `committed` status and block
                                      `22482472`
  -----------------------------------------------------------------------

All evidence files are stored under:

``` text
week-04/evidence/
```

------------------------------------------------------------------------

## 9. Conclusion

Week 4 focused on building a practical CKB application rather than only
studying individual CKB concepts.

The final CKB Asset Manager successfully integrates wallet connection,
CKB, xUDT, Spore, message signing, and transaction querying on CKB
Testnet. The implementation also provided practical experience with CCC,
JoyID, Testnet transactions, and debugging during integration.

This week helped bridge the gap between learning CKB concepts and using
those concepts to build a functional application.
