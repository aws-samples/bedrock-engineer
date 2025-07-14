module.exports = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);
