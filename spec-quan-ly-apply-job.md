# Đặc tả sản phẩm — Quản lý ứng tuyển việc làm

**Phiên bản:** 1.0 (bản đề xuất MVP)  
**Ngày:** 13/09/2026  
**Đối tượng:** Một người tìm việc quản lý nhiều hồ sơ ứng tuyển trên web.

> **Giả định cần xác nhận:** Đây là ứng dụng dành cho người ứng tuyển, không phải hệ thống tuyển dụng của doanh nghiệp. Một tài khoản chỉ xem và sửa dữ liệu của chính mình. Người dùng tự nhập thông tin; phiên bản đầu chưa tự lấy dữ liệu từ email hoặc trang tuyển dụng. Những lựa chọn này có thể đổi mà không làm thay đổi mục tiêu cốt lõi.

## 1. Mục tiêu và phạm vi

Người dùng hiện dễ thất lạc tin tuyển dụng, quên đã gửi CV phiên bản nào, không nhớ bước tiếp theo hoặc lịch phỏng vấn. Sản phẩm cung cấp một nơi để ghi lại từng cơ hội, theo dõi tiến độ và biết hôm nay cần làm gì.

**Kết quả mong muốn:**

- Ghi lại một cơ hội mới trong dưới một phút với các trường bắt buộc tối thiểu.
- Xem ngay số đơn theo trạng thái, các cuộc phỏng vấn và việc sắp đến hạn.
- Tìm lại đơn đã ứng tuyển theo công ty, vị trí, trạng thái hoặc khoảng ngày.
- Xem dòng thời gian thay đổi của một đơn để biết đã trao đổi và thực hiện gì.

**Trong MVP:** tài khoản cá nhân, CRUD đơn ứng tuyển, quy trình trạng thái, ghi chú và lịch sử, lịch phỏng vấn, việc cần làm có hạn, dashboard, tìm kiếm/lọc/sắp xếp, giao diện responsive.

**Ngoài MVP:** tìm việc tự động, gửi đơn ứng tuyển, đọc hộp thư, đồng bộ Google Calendar, AI chấm điểm CV, chia sẻ hồ sơ cho nhóm, thông báo qua email/push, lưu tệp CV lên máy chủ, extension trình duyệt.

## 2. Người dùng và hành trình chính

**Vai trò duy nhất — Chủ tài khoản:** đăng nhập, quản lý toàn bộ dữ liệu của mình; không tồn tại quyền quản trị hoặc quyền truy cập chéo tài khoản trong giao diện sản phẩm.

1. Người dùng thấy một tin tuyển dụng → lưu công ty, vị trí, URL và trạng thái **Đã lưu**.
2. Sau khi gửi hồ sơ → đổi thành **Đã ứng tuyển**, nhập ngày nộp, nguồn ứng tuyển và CV đã dùng (tên/đường dẫn tham chiếu nếu có).
3. Nhà tuyển dụng phản hồi → đổi trạng thái, tạo lịch phỏng vấn, thêm ghi chú và việc cần làm.
4. Khi nhận kết quả → chuyển **Nhận offer**, **Bị từ chối** hoặc **Đã rút**; xem lại lịch sử đầy đủ.

## 3. Quy tắc trạng thái

| Mã | Nhãn hiển thị | Ý nghĩa |
| --- | --- | --- |
| `SAVED` | Đã lưu | Quan tâm nhưng chưa nộp hồ sơ |
| `APPLIED` | Đã ứng tuyển | Đã gửi hồ sơ |
| `SCREENING` | Sàng lọc | Đang trao đổi hoặc làm bài đánh giá |
| `INTERVIEW` | Phỏng vấn | Đang trong các vòng phỏng vấn |
| `OFFER` | Nhận offer | Đã nhận đề nghị làm việc |
| `REJECTED` | Bị từ chối | Nhà tuyển dụng từ chối hoặc quy trình kết thúc không có offer |
| `WITHDRAWN` | Đã rút | Người dùng chủ động ngừng theo đuổi |

- Trạng thái ban đầu là `SAVED`; khi tạo có thể chọn trạng thái khác nếu nhập dữ liệu cũ.
- Cho phép chuyển giữa mọi trạng thái, kể cả mở lại đơn đã kết thúc, vì thực tế quy trình có thể thay đổi; mọi lần chuyển phải ghi vào lịch sử (`from`, `to`, thời điểm).
- Khi chuyển sang `APPLIED` hoặc các bước sau, yêu cầu `appliedAt` nếu chưa có; ngày nộp không được ở tương lai. Nếu tạo trực tiếp trạng thái `REJECTED`/`WITHDRAWN` cho cơ hội chưa từng nộp, `appliedAt` có thể để trống.
- `OFFER`, `REJECTED`, `WITHDRAWN` là trạng thái kết thúc để tính **đơn đang hoạt động**, nhưng lịch phỏng vấn và việc cần làm vẫn được lưu. Người dùng có thể mở lại.
- Xóa đơn là xóa mềm: không còn hiển thị trong danh sách/dashboard; các bản ghi con vẫn gắn với đơn để có thể khôi phục về sau. MVP có xác nhận trước khi xóa, chưa cần màn hình khôi phục.

## 4. Yêu cầu chức năng

### F01 — Tài khoản và quyền truy cập

- Đăng ký bằng email và mật khẩu; xác thực email là lựa chọn triển khai, nếu chưa có phải nêu rõ trong UI. Đăng nhập, đăng xuất và đặt lại mật khẩu qua email là điều kiện cần trước khi mở ứng dụng cho người dùng thật.
- Mỗi request đọc/ghi dữ liệu phải ràng buộc `userId` từ phiên xác thực; không tin `userId` gửi từ client.
- Nếu xây bản demo chạy cục bộ, có thể thay bằng một tài khoản mẫu; khi đó không coi bản demo đã đáp ứng yêu cầu phát hành cho người dùng thật.

### F02 — Quản lý đơn ứng tuyển

- Tạo, xem, sửa và xóa mềm một đơn. Trường bắt buộc: `companyName`, `jobTitle`. Những trường còn lại có thể bổ sung sau.
- Trường tùy chọn: `jobUrl`, `location`, `workMode` (onsite/hybrid/remote), `employmentType` (full-time/part-time/contract/internship/other), `source`, `salaryText`, `description`, `appliedAt`, `deadlineAt`, `cvReference`, `contactName`, `contactEmail`, `notes`.
- URL chỉ nhận `http`/`https`; email liên hệ phải hợp lệ nếu có; giới hạn độ dài đầu vào và hiển thị thông báo lỗi ngay tại trường.
- Nếu URL tuyển dụng trùng một đơn chưa xóa của cùng người dùng, hiện cảnh báo và liên kết tới đơn cũ, nhưng vẫn cho lưu: ứng tuyển lại có thể là chủ ý. Nếu không có URL, không chặn trùng công ty + vị trí.
- Thay đổi nội dung chính cập nhật `updatedAt`; đổi trạng thái tạo một sự kiện lịch sử. Ghi chú mới là một sự kiện riêng, không ghi đè ghi chú cũ.
- Ở màn hình chi tiết, URL gốc mở ở tab mới; xác nhận rõ trước khi xóa.

### F03 — Danh sách và tìm kiếm

- Danh sách hiển thị công ty, vị trí, trạng thái, ngày nộp (nếu có), ngày cập nhật gần nhất, hạn nộp (nếu có).
- Tìm không phân biệt hoa/thường theo tên công ty và vị trí; lọc theo một/nhiều trạng thái, nguồn, khoảng ngày nộp; sắp xếp mới cập nhật trước (mặc định), ngày nộp hoặc tên công ty.
- Phân trang phía server (mặc định 20, tối đa 100 bản ghi/trang). Bộ lọc và trang hiện tại phản ánh trong URL để có thể quay lại/chia sẻ liên kết trong cùng tài khoản.
- Có trạng thái rỗng, đang tải và lỗi; không trả đơn đã xóa.

### F04 — Lịch sử và ghi chú

- Màn hình chi tiết hiển thị dòng thời gian theo thời điểm mới nhất: tạo đơn, đổi trạng thái, thêm ghi chú, tạo/đổi/hủy lịch phỏng vấn, hoàn thành việc cần làm.
- Ghi chú gồm nội dung và thời gian; cho phép sửa/xóa ghi chú của mình. Nếu sửa, hiển thị dấu “Đã chỉnh sửa”; lịch sử thay đổi trạng thái là bất biến.
- Nội dung ghi chú hiển thị dạng văn bản thuần, không diễn giải HTML để tránh mã độc chèn từ người dùng.

### F05 — Phỏng vấn

- Tạo/sửa/hủy một hoặc nhiều buổi phỏng vấn gắn với đơn: `title`, `startsAt`, `endsAt`, `timeZone`, `format` (online/onsite/phone), `locationOrMeetingUrl`, `interviewer`, `note`.
- `endsAt` phải sau `startsAt`; lưu thời gian theo UTC và múi giờ gốc để hiển thị chính xác. Có thể tạo buổi phỏng vấn dù trạng thái đơn chưa là `INTERVIEW`, nhưng UI gợi ý cập nhật trạng thái.
- Danh sách “Sắp diễn ra” chỉ tính buổi chưa hủy với `startsAt >= now`, sắp xếp gần nhất trước; không tự gửi email hoặc push trong MVP.
- Hủy buổi phỏng vấn giữ bản ghi và gắn `cancelledAt` để dòng thời gian vẫn đúng.

### F06 — Việc cần làm

- Tạo/sửa/xóa/hoàn thành việc gắn với đơn: `title`, `dueAt` (tùy chọn), `completedAt`, `note`.
- Dashboard hiển thị việc chưa hoàn thành quá hạn hoặc đến hạn trong 7 ngày tới; tính quá hạn theo múi giờ hiển thị của người dùng.
- Việc không có hạn vẫn hiển thị trong trang chi tiết, không nằm trong danh sách sắp đến hạn.

### F07 — Dashboard

- Thẻ số liệu: tổng đơn chưa xóa, đơn đang hoạt động (`APPLIED`, `SCREENING`, `INTERVIEW`), số đơn theo từng trạng thái, phỏng vấn sắp tới trong 7 ngày, việc quá hạn/sắp đến hạn.
- Các thẻ thời gian dẫn tới danh sách đã lọc tương ứng. Nếu chưa có dữ liệu, hiển thị hướng dẫn tạo đơn đầu tiên.
- Chưa tính tỷ lệ chuyển đổi hay “tỷ lệ thành công” trong MVP vì mẫu nhỏ dễ gây hiểu sai; có thể bổ sung báo cáo ở giai đoạn sau với định nghĩa mẫu số rõ ràng.

## 5. Màn hình và tương tác

| Màn hình | Nội dung chính | Hành động |
| --- | --- | --- |
| Đăng nhập/đăng ký | Form, lỗi xác thực, đường dẫn đặt lại mật khẩu | Vào tài khoản |
| Dashboard | Số liệu, phỏng vấn và việc sắp tới | Đi đến đơn, thêm đơn |
| Danh sách đơn | Tìm kiếm, bộ lọc, sắp xếp, phân trang, bảng/card mobile | Xem chi tiết, thêm đơn |
| Tạo/sửa đơn | Form chia nhóm “Cơ bản”, “Quá trình”, “Thông tin thêm” | Lưu, hủy |
| Chi tiết đơn | Thông tin, trạng thái, timeline, phỏng vấn, việc cần làm | Sửa, đổi trạng thái, ghi chú, xóa |
| Tài khoản | Email, múi giờ hiển thị | Đăng xuất, đổi thông tin phù hợp |

**Trải nghiệm tối thiểu:** chạy tốt từ màn hình mobile 360 px; thao tác bằng bàn phím; trường có nhãn, thông báo lỗi cụ thể và focus rõ; hành động bất đồng bộ có trạng thái loading; khi lưu thất bại giữ lại dữ liệu đang nhập. Giao diện dùng tiếng Việt, ngày hiển thị theo múi giờ đã chọn (mặc định `Asia/Ho_Chi_Minh`).

## 6. Mô hình dữ liệu đề xuất

| Thực thể | Trường chính | Ràng buộc |
| --- | --- | --- |
| `User` | `id`, `email`, `passwordHash`, `timeZone`, `createdAt` | Email duy nhất; mật khẩu chỉ lưu dạng hash |
| `Application` | `id`, `userId`, `companyName`, `jobTitle`, `status`, các trường ở F02, `createdAt`, `updatedAt`, `deletedAt` | `companyName`/`jobTitle` không rỗng; index `(userId, deletedAt, updatedAt)` |
| `Activity` | `id`, `applicationId`, `type`, `payload`, `createdAt` | Sự kiện đổi trạng thái không sửa/xóa; payload có `from`/`to` |
| `Note` | `id`, `applicationId`, `content`, `createdAt`, `updatedAt`, `deletedAt` | Nội dung không rỗng |
| `Interview` | `id`, `applicationId`, các trường ở F05, `createdAt`, `updatedAt`, `cancelledAt` | `endsAt > startsAt` |
| `Task` | `id`, `applicationId`, `title`, `note`, `dueAt`, `completedAt`, `createdAt`, `updatedAt` | Tiêu đề không rỗng |

`Activity` là nhật ký hiển thị; các bảng `Note`, `Interview`, `Task` giữ dữ liệu hiện tại. Việc cập nhật thực thể và ghi sự kiện tương ứng phải nằm trong cùng một transaction để tránh timeline lệch trạng thái. Mọi truy vấn theo `applicationId` phải kiểm tra quyền sở hữu qua `Application.userId`.

**Quy ước thời gian:** `createdAt`/`updatedAt`/`startsAt`/`endsAt`/`dueAt` là timestamp UTC; `appliedAt` và `deadlineAt` là ngày lịch (`YYYY-MM-DD`) để tránh đổi ngày khi thay múi giờ. `timeZone` lưu tên IANA; `null` nghĩa là chưa có giá trị. Mọi ID sinh ở server.

## 7. Hợp đồng API tham khảo

Nếu frontend và backend tách riêng, dùng API JSON dưới `/api/v1`; đây là đề xuất giao tiếp, có thể đổi sang server actions nếu vẫn giữ cùng hành vi.

| Phương thức | Đường dẫn | Ý nghĩa |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` | Tài khoản |
| `GET`, `POST` | `/applications` | Danh sách có `q`, `status`, `source`, `appliedFrom`, `appliedTo`, `sort`, `page`, `pageSize`; tạo mới |
| `GET`, `PATCH`, `DELETE` | `/applications/{id}` | Chi tiết, sửa, xóa mềm |
| `POST` | `/applications/{id}/status` | Đổi trạng thái có lịch sử |
| `GET`, `POST` | `/applications/{id}/notes` | Danh sách và thêm ghi chú |
| `PATCH`, `DELETE` | `/applications/{id}/notes/{noteId}` | Sửa/xóa ghi chú |
| `GET`, `POST` | `/applications/{id}/interviews` | Danh sách/tạo phỏng vấn |
| `PATCH`, `DELETE` | `/applications/{id}/interviews/{interviewId}` | Sửa/hủy phỏng vấn (DELETE là hủy mềm) |
| `GET`, `POST` | `/applications/{id}/tasks` | Danh sách/tạo việc |
| `PATCH`, `DELETE` | `/applications/{id}/tasks/{taskId}` | Sửa/xóa/hoàn thành việc |
| `GET` | `/dashboard` | Tổng hợp số liệu theo cùng quyền và quy tắc lọc |

- Phân trang trả `{ items, page, pageSize, total }`; `total` là tổng sau khi lọc, trước phân trang.
- Lỗi trả `{ error: { code, message, fieldErrors? } }`; dùng `400/422` cho input, `401` chưa xác thực, `404` không tồn tại hoặc không thuộc tài khoản, `409` khi xung đột cập nhật cần xử lý. Không trả dữ liệu tài khoản khác trong thông báo lỗi.
- Các mutation kiểm tra dữ liệu ở server; tạo đơn, đổi trạng thái và thêm Activity dùng transaction. Nếu nhiều thiết bị cùng sửa một đơn, dùng `updatedAt` hoặc version để phát hiện ghi đè; UI báo tải lại thay vì lặng lẽ mất dữ liệu.

## 8. Tiêu chí nghiệm thu MVP

1. Tạo đơn chỉ với công ty và vị trí → đơn xuất hiện ở danh sách, dashboard tăng một, trạng thái `SAVED`.
2. Nộp đơn và nhập ngày nộp hợp lệ → trạng thái `APPLIED`, xuất hiện bản ghi đổi trạng thái trong timeline; ngày nộp tương lai bị từ chối.
3. Mở lại đơn `REJECTED` thành `INTERVIEW` → dashboard cập nhật theo trạng thái mới, timeline giữ cả hai lần chuyển.
4. Tạo phỏng vấn có giờ kết thúc trước giờ bắt đầu → nhận lỗi tại trường; tạo hợp lệ → hiện ở mục “Sắp diễn ra” nếu trong 7 ngày.
5. Tạo việc đến hạn hôm qua, sau đó hoàn thành → ban đầu hiện ở mục quá hạn, sau khi hoàn thành không còn ở mục đó.
6. Tìm công ty không phân biệt chữ hoa, lọc `INTERVIEW`, đổi trang rồi quay lại → bộ lọc vẫn nằm trong URL và kết quả khớp.
7. Xóa một đơn → biến mất khỏi danh sách và thống kê; truy cập URL chi tiết trả `404`; API không làm mất dữ liệu của đơn khác.
8. Người dùng A truy cập/chỉnh sửa ID đơn, ghi chú, phỏng vấn hoặc việc của B → đều bị từ chối; không lộ nội dung của B.
9. Lưu form khi mạng lỗi → thông báo lỗi và vẫn giữ nội dung đã nhập để thử lại.
10. Dùng bàn phím trên mobile/desktop → truy cập được form, bộ lọc, menu, hộp xác nhận và nút đổi trạng thái; lỗi có nhãn đọc được.

## 9. Yêu cầu phi chức năng và kiểm thử

- **Bảo mật:** chỉ dùng HTTPS khi triển khai; hash mật khẩu bằng thuật toán phù hợp (Argon2id hoặc bcrypt); cookie phiên `HttpOnly`, `Secure`, `SameSite`; kiểm soát CSRF nếu dùng cookie; rate limit các API xác thực; kiểm tra quyền trên mọi tài nguyên con; không ghi mật khẩu/token vào log.
- **Riêng tư:** dữ liệu ứng tuyển có thể chứa thông tin liên hệ; tránh nhúng trực tiếp vào analytics bên thứ ba. Có cách xóa tài khoản và dữ liệu liên quan trước khi phát hành công khai (có thể xử lý qua hỗ trợ ở phiên bản đầu nếu được mô tả rõ).
- **Hiệu năng mục tiêu:** với tài khoản có tối đa 1.000 đơn, tìm/lọc/trang và dashboard đáp ứng trong khoảng 2 giây ở điều kiện mạng thông thường; đo ở môi trường triển khai để xác nhận. Phân trang và index theo `userId` là bắt buộc.
- **Tin cậy:** sao lưu cơ sở dữ liệu định kỳ theo năng lực môi trường triển khai; migration có thể rollback; lỗi ghi dữ liệu không tạo Activity mồ côi.
- **Chất lượng:** kiểm thử tự động cho validation, chuyển trạng thái, tổng hợp dashboard và phân quyền; ít nhất một luồng end-to-end “tạo đơn → nộp → phỏng vấn → kết thúc”; kiểm tra responsive và accessibility ở các màn hình chính.
- **Công cụ phát triển gợi ý:** frontend React + TypeScript; framework, cơ sở dữ liệu và nơi triển khai sẽ quyết định sau khi biết repo hiện tại. Thiết lập formatter/linter và kiểm tra type trong CI; không ép một stack mới chỉ từ bản spec này.

## 10. Thứ tự triển khai

1. **Nền tảng:** xác thực, schema/migration, quyền sở hữu dữ liệu, layout và routing.
2. **Luồng cốt lõi:** CRUD đơn, trạng thái, timeline, danh sách tìm/lọc/phân trang.
3. **Theo dõi:** phỏng vấn, việc cần làm và dashboard.
4. **Hoàn thiện:** validation, empty/error/loading states, mobile, accessibility, kiểm thử, backup và hướng dẫn triển khai.

## 11. Câu hỏi để chốt trước khi triển khai

1. Ứng dụng chỉ dùng cá nhân hay sẽ có nhiều người dùng/nhóm chia sẻ đơn?
2. Bạn đã có repo hoặc stack mong muốn (ví dụ React/Next.js, Node, database) chưa?
3. MVP có cần tải lên CV và gửi nhắc việc qua email, hay chỉ lưu tham chiếu CV và xem việc sắp tới trong ứng dụng?
4. Muốn dùng tiếng Việt duy nhất hay có thêm giao diện tiếng Anh?
5. Có cần nhập dữ liệu cũ từ CSV ngay trong phiên bản đầu không?

**Tiêu chuẩn chốt MVP:** hoàn thành các tiêu chí ở mục 8, không có lỗi phân quyền nghiêm trọng, chạy được trên mobile/desktop và có hướng dẫn cài đặt/triển khai.
