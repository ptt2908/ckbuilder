# Week 8 — Research Log

Final report: [ckb_weekly_report_w8.md](../ckb_weekly_report_w8.md)

## Mục tiêu

Nghiên cứu 2–3 hướng capstone phù hợp với CKB Builder Handbook, tận dụng những gì đã học trong 7 tuần đầu, và chuẩn bị đề xuất để trao đổi với Neon. Tuần này ưu tiên research và các demo kiểm chứng nhỏ; chưa bắt đầu xây dựng capstone chính và chưa chốt ý tưởng.

## Nguyên tắc làm việc

- Bám theo chủ đề, lộ trình và tài liệu trong CKB Builder Handbook.
- Dùng repo, report và nghiên cứu của Hiệp làm tài liệu tham khảo; ghi nhận nguồn, không sao chép nguyên văn.
- Phân biệt kết quả đã tự kiểm chứng với giả thuyết hoặc nội dung lấy từ tài liệu.
- Chỉ làm demo nhỏ để kiểm tra tính khả thi; chưa mở rộng thành sản phẩm.
- Không gửi giao dịch Testnet hoặc sử dụng tài sản thật nếu chưa xem lại thao tác và được người dùng xác nhận.

## Shortlist ý tưởng ban đầu

### 1. DOB Studio / Spore Badge Explorer

Mở rộng nền Spore Badge hiện có để tạo hoặc xem DOB có Cluster metadata, DNA và traits sau khi decode. Câu hỏi đầu tiên là liệu có thể chạy DOB/0 decode với một mẫu cố định và tái sử dụng được phần nào của app hiện có.

### 2. Milestone payments qua Fiber

Nghiên cứu luồng thanh toán sau khi milestone được duyệt, tập trung vào mức độ phù hợp với chủ đề payment channels trong Handbook. Proof-to-Pay là một ứng viên trong hướng này; cần làm rõ khác biệt giữa Fiber payment channel và giao dịch CKB trực tiếp.

### 3. NervosDAO companion

Nghiên cứu một ứng dụng giúp xem hoặc mô phỏng trạng thái deposit, compensation và quy trình withdraw hai giai đoạn của NervosDAO. [Report](./nervosdao-companion-research.md) · [Demo](./nervosdao-companion-demo/README.md)

Các ý tưởng trên chỉ là shortlist nghiên cứu. Chưa có capstone nào được chọn.

## Kết quả research và demo

- [DOB Studio / DOB/0 decoder](./dob-studio-research.md) — report và host demo; xem giới hạn RISC-V trong report.
- [Fiber Payment Ops](./fiber-research.md) — report và demo no-fund; chưa thử thanh toán có tiền.
- [NervosDAO Companion](./nervosdao-companion-research.md) — report và demo RPC chỉ đọc; chưa quét cell của ví.

Các kết quả này là research/spike; chưa có capstone nào được chọn.

## Tiêu chí so sánh ý tưởng

- Mức độ phù hợp với Handbook.
- CKB được dùng như phần cốt lõi của giải pháp ra sao.
- Có tận dụng được kỹ năng và nền tảng đã có không.
- Giá trị và người dùng mục tiêu có đủ rõ không.
- Có thể hoàn thành MVP trong thời gian chương trình không.
- Rủi ro kỹ thuật, vận hành và các câu hỏi cần Neon tư vấn.

## Việc cần hoàn thành trong Week 8

- [x] Đọc và ghi chú nguồn chính thức cho từng hướng trong shortlist.
- [x] Thực hiện spike nhỏ cho cả ba hướng và ghi kết quả thực tế.
- [ ] So sánh các ý tưởng theo cùng tiêu chí.
- [ ] Chuẩn bị đề xuất capstone và câu hỏi để trao đổi với Neon.
- [x] Cập nhật report bằng kết quả tự nghiên cứu, có dẫn nguồn.

## Nguồn tham khảo

- CKB Builder Handbook: `D:/Downloads/CKB Builder Handbook (1).docx`
- Repo tham khảo của Hiệp: <https://github.com/hiepthach/CKBuilder/tree/main/>
- Spore Contract Analysis của Hiệp: `D:/Downloads/ANALYSIS_spore_contract.md`
- DOB Decoder Server Analysis của Hiệp: `D:/Downloads/DOB-Decoder-Standalone-Server_EXPLAINED.md`
- Spore DOB/0 Cookbook: <https://github.com/sporeprotocol/dob-cookbook/tree/main/examples/dob0>
- CCC Spore Guide: <https://github.com/ckb-devrel/ccc/blob/master/packages/docs/content/docs/guides/spore-protocol.mdx>

## Cấu trúc report cuối tuần dự kiến

1. Mục tiêu và phạm vi nghiên cứu.
2. Nguồn đã đọc và câu hỏi nghiên cứu.
3. Phát hiện chính, ghi bằng lời của mình và có dẫn nguồn.
4. Demo nhỏ: cách làm, input/output, bằng chứng và giới hạn.
5. So sánh shortlist và đề xuất hướng capstone.
6. Câu hỏi cần trao đổi với Neon.
7. Kế hoạch bước tiếp theo.







