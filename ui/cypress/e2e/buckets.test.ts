import {Bucket, Organization} from '../../src/types'

describe('Buckets', () => {
  beforeEach(() => {
    cy.flush()

    cy.signin().then(({body}) => {
      const {
        org: {id},
        bucket,
      } = body
      cy.wrap(body.org).as('org')
      cy.wrap(bucket).as('bucket')
      cy.fixture('routes').then(({orgs, buckets}) => {
        cy.visit(`${orgs}/${id}${buckets}`)
      })
    })
  })

  describe('from the buckets index page', () => {
    it('can create a bucket', () => {
      const newBucket = '🅱️ucket'
      cy.getByTestID(`bucket--card--name ${newBucket}`).should('not.exist')

      cy.getByTestID('Create Bucket').click()
      cy.getByTestID('overlay--container').within(() => {
        cy.getByInputName('name').type(newBucket)
        cy.get('.cf-button')
          .contains('Create')
          .click()
      })

      cy.getByTestID(`bucket--card--name ${newBucket}`).should('exist')
    })

    it("can update a bucket's retention rules", () => {
      cy.get<Bucket>('@bucket').then(({name}: Bucket) => {
        cy.getByTestID(`bucket--card--name ${name}`).click()
        cy.getByTestID(`bucket--card--name ${name}`).should(
          'not.contain',
          '7 days'
        )
      })

      cy.getByTestID('retention-intervals--button').click()
      cy.getByTestID('duration-selector--button').click()
      cy.getByTestID('duration-selector--7d').click()

      cy.getByTestID('overlay--container').within(() => {
        cy.contains('Save').click()
      })

      cy.get<Bucket>('@bucket').then(() => {
        cy.getByTestID(`cf-resource-card--meta-item`).should(
          'contain',
          '7 days'
        )
      })
    })

    describe('Searching and Sorting', () => {
      it('Searching buckets', () => {
        cy.getByTestID('search-widget').type('tasks')
        cy.getByTestID('bucket-card').should('have.length', 1)
      })

      it('Sorting by Name', () => {
        cy.getByTestID('name-sorter').click()
        cy.getByTestID('bucket-card')
          .first()
          .contains('defbuck')

        cy.getByTestID('name-sorter').click()
        cy.getByTestID('bucket-card')
          .first()
          .contains('_monitoring')
      })

      it('Sorting by Retention', () => {
        cy.getByTestID('retention-sorter').click()
        cy.getByTestID('bucket-card')
          .first()
          .contains('_tasks')

        cy.getByTestID('retention-sorter').click()
        cy.getByTestID('bucket-card')
          .first()
          .contains('defbuck')
      })
    })

    // Currently producing a false negative
    it.skip('can delete a bucket', () => {
      const bucket1 = 'newbucket1'
      cy.get<Organization>('@org').then(({id, name}: Organization) => {
        cy.createBucket(id, name, bucket1)
      })

      cy.getByTestID(`context-delete-menu ${bucket1}`).click()
      cy.getByTestID(`context-delete-bucket ${bucket1}`).click()

      // normally we would assert for empty state here
      // but we cannot because of the default system buckets
      // since cypress selectors are so fast, that sometimes a bucket
      // that is deleted will be selected before it gets deleted
      cy.wait(10000)

      cy.getByTestID(`bucket--card--name ${bucket1}`).should('not.exist')
    })
  })

  // skipping until feature flag feature is removed for deleteWithPredicate
  describe.skip('should default the bucket to the selected bucket', () => {
    beforeEach(() => {
      cy.get<Organization>('@org').then(({id, name}) => {
        cy.createBucket(id, name, 'Funky Town').then(() => {
          cy.createBucket(id, name, 'ABC').then(() => {
            cy.createBucket(id, name, 'Jimmy Mack')
          })
        })
      })
    })

    it('should set the default bucket in the dropdown to the selected bucket', () => {
      cy.getByTestID('bucket-delete-task')
        .first()
        .click()
        .then(() => {
          cy.getByTestID('dropdown--button').contains('ABC')
          cy.get('.cf-overlay--dismiss').click()
        })
        .then(() => {
          cy.getByTestID('bucket-delete-task')
            .last()
            .click()
            .then(() => {
              cy.getByTestID('dropdown--button').contains('Jimmy Mack')
            })
        })
    })

    it('alphabetizes buckets', () => {
      cy.getByTestID('bucket-delete-task')
        .first()
        .click()
        .then(() => {
          cy.getByTestID('dropdown--button')
            .contains('ABC')
            .click()
            .then(() => {
              // get the bucket list
              cy.get('.cf-dropdown-item--children')
                .should('have.length', 6)
                .then(el => {
                  const results = []
                  // output in an array
                  el.text((index, currentContent) => {
                    results[index] = currentContent
                  })
                  const expectedOrder = [
                    'ABC',
                    'defbuck',
                    'Funky Town',
                    'Jimmy Mack',
                    '_monitoring',
                    '_tasks',
                  ]
                  // check the order
                  expect(results).to.deep.equal(expectedOrder)
                })
            })
        })
    })
  })

  // skipping until feature flag feature is removed for deleteWithPredicate
  describe.skip('delete with predicate', () => {
    beforeEach(() => {
      cy.getByTestID('bucket-delete-task').click()
      cy.getByTestID('overlay--container').should('have.length', 1)
    })

    it('requires consent to perform delete with predicate', () => {
      // confirm delete is disabled
      cy.getByTestID('confirm-delete-btn').should('be.disabled')
      // checks the consent input
      cy.getByTestID('delete-checkbox').check({force: true})
      // can delete
      cy.getByTestID('confirm-delete-btn')
        .should('not.be.disabled')
        .click()
    })

    // this is currently not producing success, its actually failing, im going to write a separate issue for this
    it('closes the overlay upon a successful delete with predicate submission', () => {
      cy.getByTestID('delete-checkbox').check({force: true})
      cy.getByTestID('confirm-delete-btn').click()
      cy.getByTestID('overlay--container').should('not.exist')
      cy.getByTestID('notification-success').should('have.length', 1)
    })
    // needs relevant data in order to test functionality
    it.skip('should require key-value pairs when deleting predicate with filters', () => {
      // confirm delete is disabled
      cy.getByTestID('add-filter-btn').click()
      // checks the consent input
      cy.getByTestID('delete-checkbox').check({force: true})
      // cannot delete
      cy.getByTestID('confirm-delete-btn').should('be.disabled')

      // should display warnings
      cy.getByTestID('form--element-error').should('have.length', 2)

      // TODO: add filter values based on dropdown selection in key / value
    })
  })

  describe('Routing directly to the edit overlay', () => {
    it('reroutes to buckets view if bucket does not exist', () => {
      cy.get('@org').then(({id}: Organization) => {
        cy.fixture('routes').then(({orgs, buckets}) => {
          const idThatDoesntExist = '261234d1a7f932e4'
          cy.visit(`${orgs}/${id}${buckets}/${idThatDoesntExist}/edit`)
          cy.location('pathname').should('be', `${orgs}/${id}${buckets}/`)
        })
      })
    })

    it('displays overlay if bucket exists', () => {
      cy.get('@org').then(({id: orgID}: Organization) => {
        cy.fixture('routes').then(({orgs, buckets}) => {
          cy.get('@bucket').then(({id: bucketID}: Bucket) => {
            cy.visit(`${orgs}/${orgID}${buckets}/${bucketID}/edit`)
            cy.location('pathname').should(
              'be',
              `${orgs}/${orgID}${buckets}/${bucketID}/edit`
            )
          })
          cy.getByTestID(`overlay`).should('exist')
        })
      })
    })
  })

  describe('add data', () => {
    it('writing data to buckets', () => {
      // writing a well-formed line is accepted
      cy.getByTestID('add-data--button').click()
      cy.getByTestID('bucket-add-line-protocol').click()
      cy.getByTestID('Enter Manually').click()
      cy.getByTestID('line-protocol--text-area').type('m1,t1=v1 v=1.0')
      cy.getByTestID('next').click()
      cy.getByTestID('line-protocol--status').should('have.class', 'success')
      cy.getByTestID('next').click()

      // writing a poorly-formed line errors
      cy.getByTestID('add-data--button').click()
      cy.getByTestID('bucket-add-line-protocol').click()
      cy.getByTestID('Enter Manually').click()
      cy.getByTestID('line-protocol--text-area').type('invalid invalid')
      cy.getByTestID('next').click()
      cy.getByTestID('line-protocol--status').should('have.class', 'error')
      cy.getByTestID('next').click()

      // writing a well-formed line with millisecond precision is accepted
      cy.getByTestID('add-data--button').click()
      cy.getByTestID('bucket-add-line-protocol').click()
      cy.getByTestID('Enter Manually').click()
      cy.getByTestID('wizard-step--lp-precision--dropdown').click()
      cy.getByTestID('wizard-step--lp-precision-ms').click()
      const now = Date.now()
      cy.getByTestID('line-protocol--text-area').type(`m2,t2=v2 v=2.0 ${now}`)
      cy.getByTestID('next').click()
      cy.getByTestID('line-protocol--status').should('have.class', 'success')
      cy.getByTestID('next').click()
    })
  })
})
