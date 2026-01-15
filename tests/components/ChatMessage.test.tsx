import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessage from '@/components/ChatMessage';
import type { Message } from '@/lib/types'; // Assuming this exists based on component import

// Mock props
const mockMessage: Message = {
  id: 'msg-1',
  sessionId: 'session-1',
  userId: 'user-1',
  userName: 'Test User',
  content: 'Hello World',
  userAvatar: null,
  createdAt: new Date().toISOString(),
  messageType: 'user',
  isPinned: false,
  isDeleted: false,
};

describe('ChatMessage', () => {
  it('renders message content and username', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders deleted message style', () => {
    const deletedMessage = { ...mockMessage, isDeleted: true };
    render(<ChatMessage message={deletedMessage} />);
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });

  it('shows Admin badge for admin messages', () => {
    const adminMessage = { ...mockMessage, messageType: 'admin' as const };
    render(<ChatMessage message={adminMessage} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows Pinned badge when pinned', () => {
    const pinnedMessage = { ...mockMessage, isPinned: true };
    render(<ChatMessage message={pinnedMessage} />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('shows action buttons when isAdmin is true', () => {
    const onPin = vi.fn();
    const onDelete = vi.fn();
    render(<ChatMessage message={mockMessage} isAdmin={true} onPin={onPin} onDelete={onDelete} />);
    
    // Buttons are initially invisible (opacity-0) but present in DOM
    const pinButton = screen.getByTitle('Pin');
    const deleteButton = screen.getByTitle('Delete');
    
    expect(pinButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(pinButton);
    expect(onPin).toHaveBeenCalledWith('msg-1');

    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('msg-1');
  });

  it('renders system message correctly', () => {
     const systemMessage = { ...mockMessage, messageType: 'system' as const, content: 'User joined' };
     render(<ChatMessage message={systemMessage} />);
     expect(screen.getByText('User joined')).toBeInTheDocument();
     expect(screen.queryByText('Test User')).not.toBeInTheDocument(); // System messages don't show username header usually
  });
});
