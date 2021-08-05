import { AxiosError } from 'axios'
import { FormikHelpers } from 'formik/dist/types'
import { useState } from 'react'
import { useIntl } from 'react-intl'

import { ErrorBody } from './types'
import { joinFieldErrorMessages } from './utils'

export function useMutation<FormValues, Response>(
  mutate: (body: FormValues) => Promise<Response>,
  onSuccess: (response: Response, values: FormValues) => void,
  options?: {
    apiFallbackErrorMessageId?: string
  }
): {
  apiErrorMessage: string | null
  onMutate: (
    values: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => Promise<void>
} {
  const intl = useIntl()
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null)

  const onMutate = async (
    values: FormValues,
    { setSubmitting, setErrors }: FormikHelpers<FormValues>
  ): Promise<void> => {
    try {
      setApiErrorMessage(null)
      setSubmitting(true)
      const response = await mutate(values)
      onSuccess(response, values)
    } catch (error) {
      const { response }: AxiosError<ErrorBody> = error

      if (response?.data?.errors) {
        setErrors(joinFieldErrorMessages(response.data.errors))
      }

      if (options?.apiFallbackErrorMessageId && !response?.data.message) {
        setApiErrorMessage(
          intl.formatMessage({ id: options.apiFallbackErrorMessageId })
        )
      } else {
        setApiErrorMessage(
          response?.data.message ||
            intl.formatMessage({ id: 'shared.error.api' })
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    apiErrorMessage,
    onMutate,
  }
}
