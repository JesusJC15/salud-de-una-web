describe('types barrel', () => {
  it('can be imported without runtime errors', async () => {
    await expect(import('./index')).resolves.toBeDefined()
  })
})
