const PAYSTACK_BASE = 'https://api.paystack.co'

async function paystackRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Paystack error on ${path}: ${JSON.stringify(error)}`)
  }

  return res.json()
}

export async function createCustomer(email: string, firstName: string, lastName: string, phone?: string) {
  return paystackRequest<{
    status: boolean
    data: { customer_code: string; id: number }
  }>('POST', '/customer', { email, first_name: firstName, last_name: lastName, ...(phone ? { phone } : {}) })
}

export async function fetchCustomer(emailOrCode: string) {
  return paystackRequest<{
    status: boolean
    data: { customer_code: string; id: number; dedicated_account?: { id: number; account_number: string } }
  }>('GET', `/customer/${encodeURIComponent(emailOrCode)}`)
}

export async function updateCustomer(
  customerCode: string,
  fields: { phone?: string; first_name?: string; last_name?: string }
) {
  return paystackRequest<{
    status: boolean
    data: { customer_code: string }
  }>('PUT', `/customer/${customerCode}`, fields)
}

export async function fetchDedicatedAccount(customerCode: string) {
  return paystackRequest<{
    status: boolean
    data: Array<{ id: number; account_number: string; account_name: string }>
  }>('GET', `/dedicated_account?customer=${customerCode}`)
}

export async function unassignDedicatedAccount(dedicatedAccountId: number) {
  return paystackRequest<{ status: boolean; message: string }>(
    'DELETE',
    `/dedicated_account/${dedicatedAccountId}`
  )
}

export async function createDedicatedAccount(customerCode: string) {
  return paystackRequest<{
    status: boolean
    data: {
      account_number: string
      bank: { name: string; slug: string }
    }
  }>('POST', '/dedicated_account', {
    customer: customerCode,
    preferred_bank: 'wema-bank',
  })
}
