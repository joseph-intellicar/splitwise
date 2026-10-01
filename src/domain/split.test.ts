import { splitEqually } from './split'

describe('splitEqually', () => {
  it('gives leftover paise to the first sharers in order', () => {
    expect(splitEqually(10000, ['a', 'b', 'c'])).toEqual([
      { personId: 'a', amount: 3334 },
      { personId: 'b', amount: 3333 },
      { personId: 'c', amount: 3333 },
    ])
  })

  it('drops sharers whose amount would be zero', () => {
    expect(splitEqually(2, ['a', 'b', 'c'])).toEqual([
      { personId: 'a', amount: 1 },
      { personId: 'b', amount: 1 },
    ])
  })
})
