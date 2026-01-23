import { Queue, DefaultJobOptions } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';

// Định nghĩa interface cho dữ liệu của Job
export interface OrderJobData {
  orderId: string;
}

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3, // Thử lại 3 lần nếu worker bị lỗi
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  // Chỉ giữ lại 100 job thành công gần nhất để check log nếu cần, 
  // hoặc xóa ngay bằng cách dùng { count: 0 } hoặc true
  removeOnComplete: {
    count: 100, 
    age: 3600, // Xóa sau 1 giờ bất kể số lượng
  },
  // Cực kỳ quan trọng: Tự động xóa các job lỗi sau một khoảng thời gian
  removeOnFail: {
    count: 500, // Giữ tối đa 500 job lỗi để debug
    age: 24 * 3600, // Xóa sau 24 giờ
  },
};

export const orderTimeoutQueue = new Queue<OrderJobData>('order-timeout', {
  connection: bullMqConnection,
  defaultJobOptions,
});

export const removeJobFromQueue = async (data: OrderJobData) => {
  const job = await orderTimeoutQueue.getJob(data.orderId);
  if (job) {
    await job.remove();
    console.log(`[Queue] Đã xóa job timeout cho đơn hàng: ${data.orderId}`);
  }
}

// hàm gọi khi tạo order cần thanh toán online
export const addOrderToTimeoutQueue = async (data: OrderJobData) => {
  await orderTimeoutQueue.add('order-timeout', data, {
    delay: 15 * 60 * 1000, // 15 phút
    jobId: data.orderId,
  });
};