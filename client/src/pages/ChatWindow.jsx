import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ManageSocketConnection from '../components/ManageSocketConnection';

const ChatWindow = () => {
  return (
    <div className="max-w-full sm:max-w-lg mx-auto p-4 bg-gray-100 shadow-md rounded-lg flex flex-col h-screen sm:h-auto">
      <ManageSocketConnection />
      <div className="flex-grow overflow-y-auto max-h-[70vh] p-2">
        <MessageList />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
