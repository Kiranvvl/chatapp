import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ManageSocketConnection from '../components/ManageSocketConnection';

const ChatWindow = () => {
  return (
    <div className="flex flex-col h-screen sm:h-auto max-w-full mx-auto p-4 bg-gray-100 shadow-md rounded-lg">
      <ManageSocketConnection />
      <div className="flex-grow overflow-y-auto max-h-[70vh] p-2">
        <MessageList />
      </div>
      <div className="w-full">
        <MessageInput />
      </div>
      
    </div>
    
  );
};

export default ChatWindow;


