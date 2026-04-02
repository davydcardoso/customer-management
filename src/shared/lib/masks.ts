export const digitsOnly = (value: string) => value.replace(/\D/g, "")

const applySequentialMask = (digits: string, template: string) => {
  let index = 0

  return template.replace(/#/g, () => {
    const next = digits[index]
    index += 1
    return next ?? ""
  })
}

export const applyCpfMask = (value: string) =>
  applySequentialMask(digitsOnly(value).slice(0, 11), "###.###.###-##").replace(
    /[.-]$/,
    ""
  )

export const applyCnpjMask = (value: string) =>
  applySequentialMask(
    digitsOnly(value).slice(0, 14),
    "##.###.###/####-##"
  ).replace(/[./-]$/, "")

export const applyCepMask = (value: string) =>
  applySequentialMask(digitsOnly(value).slice(0, 8), "#####-###").replace(
    /-$/,
    ""
  )

export const applyPhoneMask = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11)

  if (digits.length <= 10) {
    return applySequentialMask(digits, "(##) ####-####").replace(/[() -]$/, "")
  }

  return applySequentialMask(digits, "(##) #####-####").replace(/[() -]$/, "")
}

export const applyMask = (mask: string | null | undefined, value: string) => {
  switch (mask) {
    case "cpf":
      return applyCpfMask(value)
    case "cnpj":
      return applyCnpjMask(value)
    case "cep":
      return applyCepMask(value)
    default:
      return value
  }
}
