'use strict'

const Joi = require('joi')
const { expect } = require('chai')
const { colorScheme: colorsB } = require('../test-helpers')

const t = (module.exports = require('../create-service-tester')())

t.create('Connection error')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.name&label=Package Name&style=_shields_test'
  )
  .networkOff()
  .expectJSON({
    name: 'Package Name',
    value: 'inaccessible',
    colorB: colorsB.lightgrey,
  })

t.create('No URL specified')
  .get('.json?query=$.name&label=Package Name&style=_shields_test')
  .expectJSON({
    name: 'Package Name',
    value: 'invalid query parameter: url',
    colorB: colorsB.red,
  })

t.create('No query specified')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&label=Package Name&style=_shields_test'
  )
  .expectJSON({
    name: 'Package Name',
    value: 'invalid query parameter: query',
    colorB: colorsB.red,
  })

t.create('Malformed url')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/%0package.json&query=$.name&label=Package Name&style=_shields_test'
  )
  .expectJSON({
    name: 'Package Name',
    value: 'invalid',
    colorB: colorsB.lightgrey,
  })

t.create('JSON from url')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.name&style=_shields_test'
  )
  .expectJSON({
    name: 'custom badge',
    value: 'shields.io',
    colorB: colorsB.brightgreen,
  })

t.create('JSON from uri (support uri query paramater)')
  .get(
    '.json?uri=https://github.com/badges/shields/raw/master/package.json&query=$.name&style=_shields_test'
  )
  .expectJSON({
    name: 'custom badge',
    value: 'shields.io',
    colorB: colorsB.brightgreen,
  })

t.create('JSON from url | multiple results')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$..keywords[0:2:1]'
  )
  .expectJSON({ name: 'custom badge', value: 'GitHub, badge' })

t.create('JSON from url | caching with new query params')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.version'
  )
  .expectJSONTypes(
    Joi.object().keys({
      name: 'custom badge',
      value: Joi.string().regex(/^\d+(\.\d+)?(\.\d+)?$/),
    })
  )

t.create('JSON from url | with prefix & suffix & label')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.version&prefix=v&suffix= dev&label=Shields'
  )
  .expectJSONTypes(
    Joi.object().keys({
      name: 'Shields',
      value: Joi.string().regex(/^v\d+(\.\d+)?(\.\d+)?\sdev$/),
    })
  )

t.create('JSON from url | object doesnt exist')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.does_not_exist&style=_shields_test'
  )
  .expectJSON({
    name: 'custom badge',
    value: 'no result',
    colorB: colorsB.lightgrey,
  })

t.create('JSON from url | invalid url')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/notafile.json&query=$.version&style=_shields_test'
  )
  .expectJSON({
    name: 'custom badge',
    value: 'resource not found',
    colorB: colorsB.red,
  })

t.create('JSON from url | user color overrides default')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/package.json&query=$.name&colorB=10ADED&style=_shields_test'
  )
  .expectJSON({ name: 'custom badge', value: 'shields.io', colorB: '#10ADED' })

t.create('JSON from url | error color overrides default')
  .get(
    '.json?url=https://github.com/badges/shields/raw/master/notafile.json&query=$.version&style=_shields_test'
  )
  .expectJSON({
    name: 'custom badge',
    value: 'resource not found',
    colorB: colorsB.red,
  })

// FIXME This is a regression which should be fixed in BaseService.
// t.create('JSON from url | error color overrides user specified')
//   .get('.json?query=$.version&colorB=10ADED&style=_shields_test')
//   .expectJSON({
//     name: 'custom badge',
//     value: 'invalid query parameter: url',
//     colorB: colorsB.red,
//   })

let headers
t.create('JSON from url | request should set Accept header')
  .get('.json?url=https://json-test/api.json&query=$.name')
  .intercept(nock =>
    nock('https://json-test')
      .get('/api.json')
      .reply(200, function(uri, requestBody) {
        headers = this.req.headers
        return '{"name":"test"}'
      })
  )
  .expectJSON({ name: 'custom badge', value: 'test' })
  .after(() => {
    expect(headers).to.have.property('accept', 'application/json')
  })
