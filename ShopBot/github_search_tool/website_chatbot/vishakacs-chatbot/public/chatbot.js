import { DeepChat } from 'deep-chat';

const chatElement = document.createElement('div');
document.body.appendChild(chatElement);

new DeepChat(chatElement, {
  style: { 
    borderRadius: '10px',
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '350px',
    height: '500px'
  },
  textInput: { 
    placeholder: { 
      text: 'Ask ShopBot anything' 
    } 
  }
});
