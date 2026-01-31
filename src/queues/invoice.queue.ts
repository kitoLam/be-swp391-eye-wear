// import { Queue, DefaultJobOptions } from 'bullmq';
// import { bullMqConnection } from '../config/bullmq-connection';

// // Định nghĩa interface cho dữ liệu của Job
// export interface InvoiceJobData {
//     invoiceId: string;
// }

// export const defaultJobOptions: DefaultJobOptions = {
//   attempts: 1, 
  
//   removeOnComplete: true, // xóa ngay, không lưu history
  
//   removeOnFail: true, // log lỗi ở app, không giữ Redis
  
//   // KHÔNG backoff nếu không thật sự cần
// };
// export const invoiceTimeoutQueue = new Queue<InvoiceJobData>(
//     'invoice-timeout',
//     {
//         connection: bullMqConnection,
//         defaultJobOptions,
//     }
// );

// export const removeJobFromQueue = async (data: InvoiceJobData) => {
//     const job = await invoiceTimeoutQueue.getJob(data.invoiceId);
//     if (job) {
//         await job.remove();
//         console.log(
//             `[Queue] Đã xóa job timeout cho hóa đơn: ${data.invoiceId}`
//         );
//     }
// };

// // Hàm gọi khi tạo invoice cần thanh toán online
// export const addInvoiceToTimeoutQueue = async (data: InvoiceJobData) => {
//     await invoiceTimeoutQueue.add('invoice-timeout', data, {
//         delay: 15 * 60 * 1000, // 15 phút
//         jobId: data.invoiceId,
//     });
//     console.log(`[Queue] Đã thêm job timeout cho hóa đơn: ${data.invoiceId}`);
// };
