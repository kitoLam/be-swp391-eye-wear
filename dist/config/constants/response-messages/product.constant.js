"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductMessage = void 0;
const successSuffix = ' thành công!';
exports.ProductMessage = {
    success: {
        create: 'Tạo sản phẩm' + successSuffix,
        update: 'Cập nhật sản phẩm' + successSuffix,
        delete: 'Xóa sản phẩm' + successSuffix,
        getList: 'Lấy danh sách sản phẩm' + successSuffix,
        getDetail: 'Láy sản phẩm' + successSuffix,
    },
    error: {},
};
