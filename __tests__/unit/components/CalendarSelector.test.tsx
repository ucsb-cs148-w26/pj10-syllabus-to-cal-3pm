import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


interface GoogleCalendarMeta {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
}


function TestableCalendarPicker({
  selectedCalendarId,
  onSelect,
  calendars,
  fetchStatus,
}: {
  selectedCalendarId: string;
  onSelect: (id: string, summary: string) => void;
  calendars: GoogleCalendarMeta[];
  fetchStatus: 'idle' | 'loading' | 'ok' | 'error';
}) {
  const [open, setOpen] = useState(false);

  const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId);
  const displayLabel =
    selectedCalendar?.summary ??
    (selectedCalendarId === 'primary' ? 'Default calendar' : 'Select calendar');

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="calendar-picker-trigger"
      >
        {displayLabel}
      </button>

      {open && (
        <ul role="listbox" aria-label="Choose a Google Calendar" data-testid="calendar-dropdown">
          {fetchStatus === 'loading' && (
            <li data-testid="loading-indicator">Loading calendars…</li>
          )}
          {fetchStatus === 'error' && (
            <li data-testid="error-indicator">Could not load calendars. Try again.</li>
          )}
          {fetchStatus === 'ok' &&
            calendars.map((cal) => (
              <li
                key={cal.id}
                role="option"
                aria-selected={cal.id === selectedCalendarId}
                data-testid={`calendar-option-${cal.id}`}
                onClick={() => {
                  onSelect(cal.id, cal.summary);
                  setOpen(false);
                }}
              >
                {cal.summary}
                {cal.primary && ' (primary)'}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}


const MOCK_CALENDARS: GoogleCalendarMeta[] = [
  { id: 'primary', summary: 'Personal', primary: true, backgroundColor: '#4285f4' },
  { id: 'spring-cal-id', summary: 'Spring', primary: false, backgroundColor: '#33b679' },
  { id: 'work-cal-id', summary: 'Work', primary: false, backgroundColor: '#d50000' },
];

const BASE_PROPS = {
  selectedCalendarId: 'primary',
  onSelect: jest.fn(),
  fetchStatus: 'ok' as const,
  calendars: MOCK_CALENDARS,
};


beforeEach(() => jest.clearAllMocks());


describe('Scenario 2: User presses the calendar choice button', () => {
  it('renders a closed trigger button initially', () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    const trigger = screen.getByTestId('calendar-picker-trigger');

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('calendar-dropdown')).not.toBeInTheDocument();
  });

  it('expands the dropdown when the trigger is clicked', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);

    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    expect(screen.getByTestId('calendar-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-picker-trigger')).toHaveAttribute('aria-expanded', 'true');
  });

  it('lists all available calendars after expanding', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    for (const cal of MOCK_CALENDARS) {
      expect(screen.getByTestId(`calendar-option-${cal.id}`)).toBeInTheDocument();
    }
  });

  it('marks the primary calendar with a "(primary)" label', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    expect(screen.getByTestId('calendar-option-primary')).toHaveTextContent('(primary)');
  });

  it('shows a loading indicator while calendars are being fetched', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} fetchStatus="loading" calendars={[]} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows an error message when fetching calendars fails', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} fetchStatus="error" calendars={[]} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
  });

  it('closes the dropdown when clicked again (toggle)', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    const trigger = screen.getByTestId('calendar-picker-trigger');

    await userEvent.click(trigger);
    expect(screen.getByTestId('calendar-dropdown')).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.queryByTestId('calendar-dropdown')).not.toBeInTheDocument();
  });
});


describe('Scenario 3: User selects the Spring calendar', () => {
  it('calls onSelect with the correct id and name when a calendar is clicked', async () => {
    const onSelect = jest.fn();
    render(<TestableCalendarPicker {...BASE_PROPS} onSelect={onSelect} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    await userEvent.click(screen.getByTestId('calendar-option-spring-cal-id'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('spring-cal-id', 'Spring');
  });

  it('closes the dropdown after a calendar is selected', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));
    await userEvent.click(screen.getByTestId('calendar-option-spring-cal-id'));

    expect(screen.queryByTestId('calendar-dropdown')).not.toBeInTheDocument();
  });

  it('updates the trigger label to reflect the newly selected calendar', async () => {
    function Wrapper() {
      const [selectedId, setSelectedId] = useState('primary');
      return (
        <TestableCalendarPicker
          {...BASE_PROPS}
          selectedCalendarId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      );
    }

    render(<Wrapper />);
    expect(screen.getByTestId('calendar-picker-trigger')).toHaveTextContent('Personal');

    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));
    await userEvent.click(screen.getByTestId('calendar-option-spring-cal-id'));

    expect(screen.getByTestId('calendar-picker-trigger')).toHaveTextContent('Spring');
  });

  it('marks the selected calendar as aria-selected in the list', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} selectedCalendarId="spring-cal-id" />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    expect(screen.getByTestId('calendar-option-spring-cal-id')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('calendar-option-primary')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('calendar-option-work-cal-id')).toHaveAttribute('aria-selected', 'false');
  });
});