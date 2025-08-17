import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/frontend/components/common/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    
    expect(getByTestId('button-loading')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    const button = getByText('Test Button');
    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender, getByText } = render(
      <Button title="Primary Button" onPress={() => {}} variant="primary" />
    );
    
    expect(getByText('Primary Button')).toBeTruthy();
    
    rerender(
      <Button title="Secondary Button" onPress={() => {}} variant="secondary" />
    );
    
    expect(getByText('Secondary Button')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(
      <Button title="Small Button" onPress={() => {}} size="small" />
    );
    
    expect(getByText('Small Button')).toBeTruthy();
    
    rerender(
      <Button title="Large Button" onPress={() => {}} size="large" />
    );
    
    expect(getByText('Large Button')).toBeTruthy();
  });
});
