import * as aws from 'aws-sdk'
import { Parameter } from 'aws-sdk/clients/cloudformation'
import * as fs from 'fs'

export function isUrl(s: string): boolean {
  let url

  try {
    url = new URL(s)
  } catch (_) {
    return false
  }

  return url.protocol === 'https:'
}

export function parseTags(s: string): aws.CloudFormation.Tags | undefined {
  let json

  try {
    json = JSON.parse(s)
  } catch (_) {}

  return json
}

export function parseARNs(s: string): string[] | undefined {
  return s?.length > 0 ? s.split(',') : undefined
}

export function parseString(s: string): string | undefined {
  return s?.length > 0 ? s : undefined
}

export function parseNumber(s: string): number | undefined {
  return parseInt(s) || undefined
}

export function split(input: string, delimiter: string): string[] {
  return input
    .split('')
    .reverse()
    .join('')
    .split(new RegExp(`${delimiter}(?!\\\\)`, 'g'))
    .reverse()
    .map(x => x.split('').reverse().join(''))
}

export function parseParameters(parameterOverrides: string): Parameter[] {
  try {
    const path = new URL(parameterOverrides)
    const rawParameters = fs.readFileSync(path, 'utf-8')

    return JSON.parse(rawParameters)
  } catch (err) {
    if (err.code !== 'ERR_INVALID_URL') {
      throw err
    }
  }

  const parameters = new Map<string, string>()
  split(parameterOverrides, ',').forEach(parameter => {
    const [key, value] = split(parameter.trim(), '=')
    const escapedValue = value.replace(/\\/g, '')
    let param = parameters.get(key)
    param = !param ? escapedValue : [param, escapedValue].join(',')
    parameters.set(key, param)
  })

  return [...parameters.keys()].map(key => {
    return {
      ParameterKey: key,
      ParameterValue: parameters.get(key)
    }
  })
}
