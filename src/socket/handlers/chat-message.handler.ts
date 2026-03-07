import { Server, Socket } from 'socket.io';
import { emittedEvent, listenedEvent } from '../../config/constants/socket-event.constant';
import { BaseSocketHandler } from './base-socket-handler';
import { withValidation } from '../middlewares/validator.middleware';
import { JoinRoomRequest, JoinRoomSchema, SendMessageRequest, SendMessageSchema } from '../schemas/chat-message.schema';
import { formatDateToString } from '../../utils/formatter';
import { customerRepository } from '../../repositories/customer/customer.repository';
import { MySocketServer } from '../index.socket';

export class ChatMessageHandler extends BaseSocketHandler {
    private socket: Socket;
    constructor(socket: Socket) {
        super();
        this.socket = socket;
    }
    /*
     * Đăng kí các sự kiện mà socket sẽ lắng nghe và xử lí từ client
     */
    async registerHandler(): Promise<void> {
        // call init action
        await this.initHandler();
        // typing event
        this.socket.on(listenedEvent.SEND_MESSAGE, withValidation(SendMessageSchema, this.handleSendMessageEvent));
        // send message event
        this.socket.on(listenedEvent.TYPING, this.handleTypingEvent);
        this.socket.on(listenedEvent.JOIN_ROOM, withValidation(JoinRoomSchema, this.handlerJoinRoom));
        this.socket.on(listenedEvent.LEAVE_ROOM, withValidation(JoinRoomSchema, this.handlerLeaveRoom));
    }
    /**
     * Chạy những thứ cần thiết ban đầu khi user kết nối đến socket
     */
    initHandler = async () => {
        console.log(`${this.socket.user!.userType}:${this.socket.user?.id} is online`)
        const {id, userType} = this.socket.user!
        if(userType == "CUSTOMER"){
            // nếu là cust thì lưu trong Customer model lastOnlineAt = null
            await customerRepository.updateByFilter({
                _id: id,
            }, {lastOnlineAt: null});
            // bắn tín hiệu đến staff để biết ông này vừa vào
            this.socket.to("staff:inbox_global").emit('CUSTOMER_ONLINE', JSON.stringify({id}));
            // giả sử vào tìm trong roomChat cho ra id room rồi join vào
            const roomChatId = id;
            this.socket.join(`roomChat:${roomChatId}`);
        }
        else {
            this.socket.join('staff:inbox_global');
        }
    }
    /**
     * Chạy logic khi user out socket
     */
    endHandler = async () => {
        console.log(">>User::", this.socket.user?.id + " " + this.socket.user?.userType, " is offline");
        if(this.socket.user?.userType == "CUSTOMER"){
            // nếu là cust thì lưu Customer model lastOnline = new Date()
            await customerRepository.updateByFilter({
                _id: this.socket.user?.id,
            }, {lastOnlineAt: new Date()});
        }
    }
    private handleTypingEvent = async () => {
        
    };
    private handleSendMessageEvent = async (data: SendMessageRequest, cb: any) => {
        const {userType, id} = this.socket.user!;
        if(userType == "STAFF"){
            if(!data.roomChatId){
                // throw error
            }
        }
        // lấy hết socket đang trong room tại thời điểm này
        const viewers = await MySocketServer.getIO().in(`roomChat:${data.roomChatId}`).fetchSockets();
        if(viewers.length >= 2){
            if(this.socket.user?.userType == "CUSTOMER"){
                console.log(">>> a staff has read message");
                
            }
            else {
                console.log(">>> cust has read message");
            }
        }
        else {
            console.log(">> Bên kia vẫn chưa đọc");
            if(this.socket.user?.userType == "CUSTOMER"){
            }
        }
        const roomChatId = data.roomChatId || "1";
        const dataResponse = {
            userType,
            createdAt: formatDateToString(new Date()),
            content: data.content
        }
        // emit update chat list để đẩy roomChat mới lên ở UI list room của FE
        this.socket.to("staff:inbox_global").emit(emittedEvent.UPDATE_CHAT_LIST, JSON.stringify({
            // content, roomChatId, createdAt
        }));
        MySocketServer.getIO().to(`roomChat:${roomChatId}`).emit("RECEIVE_A_MESSAGE", JSON.stringify(dataResponse));
    };
    private handlerJoinRoom = async (data: JoinRoomRequest, cb: any) => {
        const {userType, id} = this.socket.user!;
        if(userType == "STAFF"){
            this.socket.join(`roomChat:${data.roomChatId}`);
        }
    }
    private handlerLeaveRoom = async (data: JoinRoomRequest, cb: any) => {
        const {userType, id} = this.socket.user!;
        if(userType == "STAFF"){
            if(this.socket.rooms.has(`roomChat:${data.roomChatId}`)){
                this.socket.leave(`roomChat:${data.roomChatId}`);
            }
        }
    }
}
