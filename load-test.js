import http from 'k6/http';
import { check, sleep } from 'k6';

// --- CẤU HÌNH BÀI TEST ---
export const options = {
    // 1. Kịch bản tải (Load Scenario)
    stages: [
        { duration: '10s', target: 10 }, // Giai đoạn 1: Khởi động nhẹ (tăng lên 10 người dùng trong 10s)
        { duration: '30s', target: 50 }, // Giai đoạn 2: Tải cao (tăng lên 50 người dùng trong 30s)
        { duration: '10s', target: 0 }, // Giai đoạn 3: Giảm tải về 0 để kết thúc
    ],

    // 2. Tiêu chí đạt/trượt (Pass/Fail Criteria)
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% requests phải nhanh hơn 500ms
        http_req_failed: ['rate<0.01'], // Tỷ lệ lỗi (500, 404...) phải dưới 1%
    },
};

// --- HÀM MAIN (CHẠY LẶP ĐI LẶP LẠI) ---
export default function () {
    // Cấu hình URL của server Express (Đang chạy local)
    const BASE_URL = 'http://34.92.192.47:5000/health'; // <--- SỬA PORT CỦA BẠN TẠI ĐÂY

    // === TRƯỜNG HỢP 1: TEST GET REQUEST ===
    // Ví dụ: Lấy danh sách sản phẩm/user/health-check
    const resGet = http.get(`${BASE_URL}`);

    check(resGet, {
        '[GET] status is 200': r => r.status === 200,
    });

    // === TRƯỜNG HỢP 2: TEST POST REQUEST (JSON) ===
    // Ví dụ: Tạo dữ liệu mới, Login...
    const payload = JSON.stringify({
        name: 'Test User K6',
        email: `k6user_${__VU}_${__ITER}@example.com`, // Tạo email động để tránh trùng lặp
        age: 25,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const resPost = http.post(`${BASE_URL}/api/users`, payload, params);

    check(resPost, {
        '[POST] status is 201/200': r => r.status === 201 || r.status === 200,
        '[POST] response < 500ms': r => r.timings.duration < 500,
    });

    // Nghỉ 1 giây giữa mỗi lần request để giả lập hành vi người thật
    // Nếu muốn stress test cực hạn (DDOS), hãy comment dòng này lại.
    sleep(1);
}
