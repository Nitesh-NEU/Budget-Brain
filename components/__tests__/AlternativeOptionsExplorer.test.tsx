/**
 * AlternativeOptionsExplorer Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlternativeOptionsExplorer } from '../AlternativeOptionsExplorer';
import { Allocation } from '@/types/shared';

// Mock data for testing
const mockAlternatives = [
  {
    id: 'alt-1',
    allocation: {
      google: 0.45,
      meta: 0.30,
      tiktok: 0.15,
      linkedin: 0.10
    } as Allocation,
    confidence: 0.92,
    performance: 0.88,
    reasoning: 'This allocation prioritizes Google Ads due to strong historical performance.',
    algorithmSource: 'ensemble',
    expectedOutcome: 125000,
    riskLevel: 'low' as const
  },
  {
    id: 'alt-2',
    allocation: {
      google: 0.35,
      meta: 0.40,
      tiktok: 0.20,
      linkedin: 0.05
    } as Allocation,
    confidence: 0.87,
    performance: 0.91,
    reasoning: 'Meta-focused strategy leveraging advanced audience segmentation.',
    algorithmSource: 'bayesian',
    expectedOutcome: 132000,
    riskLevel: 'medium' as const
  },
  {
    id: 'alt-3',
    allocation: {
      google: 0.50,
      meta: 0.25,
      tiktok: 0.20,
      linkedin: 0.05
    } as Allocation,
    confidence: 0.85,
    performance: 0.86,
    reasoning: 'Conservative Google-dominant strategy based on gradient optimization.',
    algorithmSource: 'gradient',
    expectedOutcome: 118000,
    riskLevel: 'low' as const
  }
];

const mockCurrentAllocation: Allocation = {
  google: 0.45,
  meta: 0.30,
  tiktok: 0.15,
  linkedin: 0.10
};

describe('AlternativeOptionsExplorer', () => {
  const mockOnSelectAlternative = jest.fn();

  beforeEach(() => {
    mockOnSelectAlternative.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
  });

  it('displays the correct number of alternatives', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('Compare 3 alternative allocation strategies')).toBeInTheDocument();
  });

  it('shows empty state when no alternatives provided', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={[]}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('No Alternative Options Available')).toBeInTheDocument();
  });

  it('displays algorithm source badges correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('ensemble')).toBeInTheDocument();
    expect(screen.getByText('bayesian')).toBeInTheDocument();
    expect(screen.getByText('gradient')).toBeInTheDocument();
  });

  it('displays confidence scores correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays risk level indicators', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getAllByText('Low Risk')).toHaveLength(2);
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('identifies current allocation correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    // The first alternative matches the current allocation
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('calls onSelectAlternative when Select button is clicked', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    // Find a Select button (not on the current allocation)
    const selectButtons = screen.getAllByText('Select');
    fireEvent.click(selectButtons[0]);
    
    expect(mockOnSelectAlternative).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        algorithmSource: expect.any(String)
      })
    );
  });

  it('opens details modal when Details button is clicked', async () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Alternative Option Details')).toBeInTheDocument();
    });
  });

  it('sorts alternatives correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    const sortSelect = screen.getByDisplayValue('Sort by Confidence');
    fireEvent.change(sortSelect, { target: { value: 'performance' } });
    
    // After sorting by performance, the order should change
    // The bayesian algorithm (91% performance) should be first
    const cards = screen.getAllByText(/Performance:/);
    expect(cards[0]).toHaveTextContent('Performance: 91%');
  });

  it('displays summary statistics correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    expect(screen.getByText('Options Summary')).toBeInTheDocument();
    expect(screen.getByText(/Avg Confidence:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Performance:/)).toBeInTheDocument();
    expect(screen.getByText(/High Confidence:/)).toBeInTheDocument();
    expect(screen.getByText(/Low Risk:/)).toBeInTheDocument();
  });

  it('handles maxDisplayed prop correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
        maxDisplayed={2}
      />
    );
    
    // Should show "Show All 3" button since we have 3 alternatives but maxDisplayed is 2
    expect(screen.getByText('Show All 3')).toBeInTheDocument();
  });

  it('toggles show all alternatives', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
        maxDisplayed={2}
      />
    );
    
    const showAllButton = screen.getByText('Show All 3');
    fireEvent.click(showAllButton);
    
    expect(screen.getByText('Show Top 2')).toBeInTheDocument();
  });

  it('displays allocation percentages correctly', () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    // Check that channel allocations are displayed as percentages
    expect(screen.getByText('45.0%')).toBeInTheDocument(); // Google in first alternative
    expect(screen.getByText('30.0%')).toBeInTheDocument(); // Meta in first alternative
  });

  it('closes details modal when close button is clicked', async () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    // Open modal
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Alternative Option Details')).toBeInTheDocument();
    });
    
    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Alternative Option Details')).not.toBeInTheDocument();
    });
  });

  it('displays reasoning text in details modal', async () => {
    render(
      <AlternativeOptionsExplorer
        alternatives={mockAlternatives}
        currentAllocation={mockCurrentAllocation}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/This allocation prioritizes Google Ads/)).toBeInTheDocument();
    });
  });
});