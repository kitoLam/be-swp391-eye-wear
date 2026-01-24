import { Queue, DefaultJobOptions } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';

// Định nghĩa interface cho dữ liệu của Job
export interface InvoiceJobData {
    invoiceId: string;
}

const defaultJobOptions: DefaultJobOptions = {
    attempts: 3, // Thử lại 3 lần nếu worker bị lỗi
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    // Chỉ giữ lại 100 job thành công gần nhất để check log nếu cần
    removeOnComplete: {
        count: 100,
        age: 3600, // Xóa sau 1 giờ bất kể số lượng
    },
    // Tự động xóa các job lỗi sau một khoảng thời gian
    removeOnFail: {
        count: 500, // Giữ tối đa 500 job lỗi để debug
        age: 24 * 3600, // Xóa sau 24 giờ
    },
};

export const invoiceTimeoutQueue = new Queue<InvoiceJobData>(
    'invoice-timeout',
    {
        connection: bullMqConnection,
        defaultJobOptions,
    }
);

export const removeJobFromQueue = async (data: InvoiceJobData) => {
    const job = await invoiceTimeoutQueue.getJob(data.invoiceId);
    if (job) {
        await job.remove();
        console.log(
            `[Queue] Đã xóa job timeout cho hóa đơn: ${data.invoiceId}`
        );
    }
};

// Hàm gọi khi tạo invoice cần thanh toán online
export const addInvoiceToTimeoutQueue = async (data: InvoiceJobData) => {
    await invoiceTimeoutQueue.add('invoice-timeout', data, {
        delay: 15 * 60 * 1000, // 15 phút
        jobId: data.invoiceId,
    });
    console.log(`[Queue] Đã thêm job timeout cho hóa đơn: ${data.invoiceId}`);
};
