export function parseCsv(text, onRow) {
  let row = []
  let field = ""
  let quoted = false
  let rowNumber = 0

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }
    if (character === '"') quoted = true
    else if (character === ",") {
      row.push(field)
      field = ""
    } else if (character === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field)
      onRow(row, rowNumber)
      rowNumber += 1
      row = []
      field = ""
    } else field += character
  }
  if (field || row.length) {
    row.push(field)
    onRow(row, rowNumber)
    rowNumber += 1
  }
  return rowNumber
}

export function rowsAsObjects(text, onObject) {
  let headers
  return parseCsv(text, (row, rowNumber) => {
    if (rowNumber === 0) {
      headers = row.map((value, index) => index === 0 ? value.replace(/^\uFEFF/, "") : value)
      return
    }
    if (!headers || row.length === 1 && row[0] === "") return
    const object = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
    onObject(object, rowNumber)
  })
}
