import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { employeesApi } from '../../api/employees';
import { employee } from '../../testing/fixtures';
import { renderWithProviders } from '../../testing/render';
import { SalaryChangeDialog } from './SalaryChangeDialog';

vi.mock('../../api/employees', () => ({
  employeesApi: { changeSalary: vi.fn() },
}));

const changeSalary = vi.mocked(employeesApi.changeSalary);

function renderDialog() {
  const onClose = vi.fn();
  renderWithProviders(<SalaryChangeDialog employee={employee()} onClose={onClose} />);
  return { onClose, user: userEvent.setup({ delay: null }) };
}

const amountField = () => screen.getByLabelText(/new annual salary/i);
const dateField = () => screen.getByLabelText(/effective date/i);
const reasonField = () => screen.getByLabelText(/reason/i);
const submit = () => screen.getByRole('button', { name: /save salary/i });

describe('SalaryChangeDialog', () => {
  beforeEach(() => {
    // Only the clock is faked, so "today" is stable without slowing anything down.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the current salary and defaults the effective date to today', () => {
    renderDialog();

    expect(screen.getByText(/current salary: £65,000/i)).toBeInTheDocument();
    expect(dateField()).toHaveValue('2025-06-15');
  });

  it('shows field errors and does not call the API when the form is incomplete', async () => {
    const { user } = renderDialog();

    await user.click(submit());

    expect(amountField()).toHaveAccessibleDescription('Must not be empty');
    expect(reasonField()).toHaveAccessibleDescription('Must not be empty');
    expect(changeSalary).not.toHaveBeenCalled();
  });

  it('rejects an effective date before the hire date', async () => {
    const { user } = renderDialog();
    await user.type(amountField(), '70000');
    fireEvent.change(dateField(), { target: { value: '2019-12-31' } });
    await user.type(reasonField(), 'Promotion');

    await user.click(submit());

    expect(dateField()).toHaveAccessibleDescription(
      'Must not be before the hire date (2020-01-06)',
    );
    expect(changeSalary).not.toHaveBeenCalled();
  });

  it('sends the amount in minor units with the version it was opened with, then closes', async () => {
    changeSalary.mockResolvedValue(employee({ salaryMinor: 7_000_050, version: 4 }));
    const { user, onClose } = renderDialog();
    await user.type(amountField(), '70,000.50');
    await user.type(reasonField(), '  Annual review ');

    await user.click(submit());

    expect(changeSalary).toHaveBeenCalledWith(7, {
      salaryMinor: 7_000_050,
      currency: 'GBP',
      effectiveDate: '2025-06-15',
      reason: 'Annual review',
      version: 3,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('explains a conflict when someone else changed the employee first', async () => {
    changeSalary.mockRejectedValue(new ApiError(409, 'CONFLICT', 'Changed by someone else'));
    const { user, onClose } = renderDialog();
    await user.type(amountField(), '70000');
    await user.type(reasonField(), 'Promotion');

    await user.click(submit());

    expect(await screen.findByText(/record changed since you opened this/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows API validation messages next to the right field', async () => {
    changeSalary.mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', [
        { path: 'salaryMinor', message: 'Is unrealistically large' },
      ]),
    );
    const { user } = renderDialog();
    await user.type(amountField(), '70000');
    await user.type(reasonField(), 'Promotion');

    await user.click(submit());

    expect(await screen.findByText('Is unrealistically large')).toBeInTheDocument();
  });
});
