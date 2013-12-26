/*global define, window, jQuery, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/WebStorage',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy'
], function( _, Class, Model, ResultSet, WebStorageProxy, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest ) {
	
	describe( 'data.persistence.proxy.WebStorage', function() {

		// Some Model classes to use
		var SimpleModel = Model.extend( {
			attributes : [ 'id', 'a', 'b' ]
		} );
		var StringIdModel = Model.extend( {
			attributes : [ { name: 'id', type: 'string' }, 'a', 'b' ]
		} );
		var ModelWithNonPersisted = Model.extend( {
			attributes : [
				{ name: 'id' },
				{ name: 'a', type: 'int' },
				{ name: 'b', type: 'int', persist: false }
			]
		} );
		
		
		// Fake storage Medium class
		var StorageMedium = Class.create( {
			constructor : function() { this.data = {}; },
			getItem     : function( itemName ) { return ( this.data[ itemName ] !== undefined ) ? this.data[ itemName ] : null; },
			setItem     : function( itemName, value ) { this.data[ itemName ] = String( value ); },  // WebStorage (localStorage/sessionStorage) always stores as a string
			removeItem  : function( itemName ) { delete this.data[ itemName ]; }
		} );
		
		// Fake storage medium, used in the tests
		var storageMedium;
		
		// ConcreteWebStorage proxy class, for use in the tests
		var ConcreteWebStorageProxy = WebStorageProxy.extend( {
			// Implementation of abstract interface
			getStorageMedium : function() { return storageMedium; }
		} );
		
		// Proxy instance for tests
		var proxy;
		
		
		beforeEach( function() {
			proxy = new ConcreteWebStorageProxy( { storageKey: 'TestKey' } );
			storageMedium = new StorageMedium();

			spyOn( storageMedium, 'getItem' ).andCallThrough();
			spyOn( storageMedium, 'setItem' ).andCallThrough();
			spyOn( storageMedium, 'removeItem' ).andCallThrough();
		} );
		
		
		describe( 'configs', function() {
			
			it( "should require the 'storageKey' config", function() {
				expect( function() {
					var proxy = new ConcreteWebStorageProxy( {
						// note: no `storageKey` config
					} );
				} ).toThrow( "`storageKey` cfg required" );
			} );
			
		} );
		
		
		describe( 'create()', function() {
			
			it( "should create a single record", function() {
				var model = new SimpleModel( { a: 1, b: 2 } ),
				    createRequest = new CreateRequest( { models: [ model ] } ),
				    resultRecords;
				
				createRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.create( createRequest );  // synchronous
				
				// Check that the record for the model was created, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 1, b: 2 } );
				expect( proxy.getRecordIds() ).toEqual( [ "1" ] );
				
				// Check that a record ID was returned in the resultset to set to the Model
				expect( resultRecords.length ).toBe( 1 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 1 } );
			} );
			
			
			it( "should create multiple records", function() {
				var model1 = new SimpleModel( { a: 1, b: 2 } ),
				    model2 = new SimpleModel( { a: 3, b: 4 } ),
				    createRequest = new CreateRequest( { models: [ model1, model2 ] } ),
				    resultRecords;
				
				createRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.create( createRequest );  // synchronous
				
				// Check that the records for the models were created, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 1, b: 2 } );
				expect( proxy.getRecord( 2 ) ).toEqual( { id: 2, a: 3, b: 4 } );
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2" ] );
				
				// Check that record IDs were returned in the resultset to set to the Models
				expect( resultRecords.length ).toBe( 2 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 1 } );
				expect( resultRecords[ 1 ] ).toEqual( { id: 2 } );
			} );
			
			
			it( "should create records in addition existing records in the storage medium, for multiple calls to create()", function() {
				// Add the first set
				var model1 = new SimpleModel( { a: 1, b: 2 } ),
				    model2 = new SimpleModel( { a: 3, b: 4 } ),
				    createRequest0 = new CreateRequest( { models: [ model1, model2 ] } );
				
				proxy.create( createRequest0 );  // synchronous
				
				
				// Add second set
				var model3 = new SimpleModel( { a: 5, b: 6 } ),
				    model4 = new SimpleModel( { a: 7, b: 8 } ),
				    createRequest1 = new CreateRequest( { models: [ model3, model4 ] } ),
				    resultRecords;
				
				createRequest1.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.create( createRequest1 );  // synchronous
				
				expect( resultRecords.length ).toBe( 2 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 3 } );
				expect( resultRecords[ 1 ] ).toEqual( { id: 4 } );
			} );
			
			
			it( "should create records with String IDs (as opposed to just Number IDs)", function() {
				/* NOTE: Never mind this test. If a Model has a string ID, the proxy's update() method will
				 *       be called from Model.save() instead. Leaving this here as a reminder.
				
				var model1 = new SimpleModel( { id: "firstId", a: 1, b: 2 } ),
				    model2 = new SimpleModel( { id: "secondId", a: 3, b: 4 } ),
				    createRequest = new CreateRequest( { models: [ model1, model2 ] } );
				
				proxy.create( createRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the records for the models were created, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: "firstId", a: 1, b: 2 } );
				expect( proxy.getRecord( 2 ) ).toEqual( { id: "secondId", a: 3, b: 4 } );
				expect( proxy.getRecordIds() ).toEqual( [ "firstId", "secondId" ] );
				
				var resultRecords = createRequest.getResultSet().getRecords();
				expect( resultRecords.length ).toBe( 2 );
				expect( resultRecords[ 0 ] ).toEqual( { id: "firstId" } );
				expect( resultRecords[ 1 ] ).toEqual( { id: "secondId" } );
				*/
			} );
			
		} );
		
		
		describe( 'read()', function() {
			
			beforeEach( function() {
				// Create some models for each test
				var model1 = new SimpleModel( { a: 1, b: 2 } ),  // id: 1
				    model2 = new SimpleModel( { a: 3, b: 4 } ),  // id: 2
				    model3 = new SimpleModel( { a: 5, b: 6 } ),  // id: 3
				    createRequest = new CreateRequest( { models: [ model1, model2, model3 ] } );
				
				proxy.create( createRequest );
			} );
			
			
			it( "should read the collection of models", function() {
				var readRequest = new ReadRequest(),
				    resultRecords;
				
				readRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.read( readRequest );  // synchronous
				
				expect( resultRecords.length ).toBe( 3 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 1, a: 1, b: 2 } );
				expect( resultRecords[ 1 ] ).toEqual( { id: 2, a: 3, b: 4 } );
				expect( resultRecords[ 2 ] ).toEqual( { id: 3, a: 5, b: 6 } );
			} );
			
			
			it( "should read a single model by ID", function() {
				var readRequest = new ReadRequest( { modelId: 1 } ),
				    resultRecords;
				
				readRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.read( readRequest );  // synchronous
				
				expect( resultRecords.length ).toBe( 1 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 1, a: 1, b: 2 } );
			} );
			
			
			it( "should read 0 models by ID if the ID doesn't exist", function() {
				var readRequest = new ReadRequest( { modelId: 99 } ),  // non-existent model
				    resultRecords;
				
				readRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.read( readRequest );  // synchronous
				
				expect( resultRecords.length ).toBe( 0 );
			} );
			
			
			it( "should read a model by a String ID (as opposed to just a Number ID)", function() {
				var model4 = new SimpleModel( { id: "fourthId", a: 7, b: 8 } ),  // for testing String IDs,
				    resultRecords;
				    
				proxy.update( new UpdateRequest( { models: [ model4 ] } ) );  // this will actually have the effect of a create(), since the ID is already assigned to the model
				
				var readRequest = new ReadRequest( { modelId: "fourthId" } );
				readRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				
				proxy.read( readRequest );  // synchronous
				
				expect( resultRecords.length ).toBe( 1 );
				expect( resultRecords[ 0 ] ).toEqual( { id: "fourthId", a: 7, b: 8 } );
			} );
			
		} );
		
		
		describe( 'update()', function() {
			var model1, model2, model3;
			
			beforeEach( function() {
				// Create some models for each test
				model1 = new SimpleModel( { a: 1, b: 2 } );  // id: 1
				model2 = new SimpleModel( { a: 3, b: 4 } );  // id: 2
				model3 = new SimpleModel( { a: 5, b: 6 } );  // id: 3
				
				var createRequest = new CreateRequest( { models: [ model1, model2, model3 ] } );
				proxy.create( createRequest );
				
				// We'll pretend that the create requests having been done from the Model class have
				// filled in the models' ID attributes as a result of the successful call to the proxy
				model1.set( 'id', 1 );
				model2.set( 'id', 2 );
				model3.set( 'id', 3 );
			} );
			
			
			it( "should update a single model", function() {
				model1.set( { a: 2, b: 3 } );  // this model's id: 1
				
				var updateRequest = new UpdateRequest( { models: [ model1 ] } );
				proxy.update( updateRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was updated, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 2, b: 3 } );
				expect( proxy.getRecord( 2 ) ).toEqual( { id: 2, a: 3, b: 4 } );  // should be the same as the initial create
				expect( proxy.getRecord( 3 ) ).toEqual( { id: 3, a: 5, b: 6 } );  // should be the same as the initial create
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3" ] );  // this should be the same as it was
			} );
			
			
			it( "should update multiple models", function() {
				model1.set( { a: 2, b: 3 } );  // this model's id: 1
				model2.set( { a: 4, b: 5 } );  // this model's id: 2
				
				var updateRequest = new UpdateRequest( { models: [ model1, model2 ] } );
				proxy.update( updateRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was updated, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 2, b: 3 } );
				expect( proxy.getRecord( 2 ) ).toEqual( { id: 2, a: 4, b: 5 } );
				expect( proxy.getRecord( 3 ) ).toEqual( { id: 3, a: 5, b: 6 } );  // should be the same as the initial create
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3" ] );  // this should be the same as it was
			} );
			
			
			it( "should have the effect of creating a record for a model if it doesn't actually exist in WebStorage (for the case that WebStorage is manually cleared by the user)", function() {
				var model = new SimpleModel( { id: 4, a: 7, b: 8 } ), // note: this model already has an ID, and that is why an update() request would normally be made for it
				    updateRequest = new CreateRequest( { models: [ model ] } );
				
				proxy.update( updateRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was created, and that bookkeeping was done
				expect( proxy.getRecord( 4 ) ).toEqual( { id: 4, a: 7, b: 8 } );
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3", "4" ] );  // should have added the number 4
			} );
			
			
			it( "should update models with String IDs (as opposed to just Number IDs)", function() {
				// Initially create a model with a string ID
				var model4 = new SimpleModel( { id: "fourthId", a: 1, b: 2 } );
				proxy.update( new UpdateRequest( { models: [ model4 ] } ) );  // has the effect of a create() in this case, since the model already has an ID
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3", "fourthId" ] );  // initial condition
				
				model4.set( { a: 2, b: 3 } );  // this model's id: "fourthId"
				
				var updateRequest = new UpdateRequest( { models: [ model4 ] } );
				proxy.update( updateRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was updated, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 1, b: 2 } );  // should be the same as the initial create
				expect( proxy.getRecord( 2 ) ).toEqual( { id: 2, a: 3, b: 4 } );  // should be the same as the initial create
				expect( proxy.getRecord( 3 ) ).toEqual( { id: 3, a: 5, b: 6 } );  // should be the same as the initial create
				expect( proxy.getRecord( 'fourthId' ) ).toEqual( { id: "fourthId", a: 2, b: 3 } );  // should be the same as the initial create
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3", "fourthId" ] );  // this should be the same as it was
			} );
			
		} );
		
		
		describe( 'destroy()', function() {
			var model1, model2, model3;
			
			beforeEach( function() {
				// Create some models for each test
				model1 = new SimpleModel( { a: 1, b: 2 } );  // id: 1
				model2 = new SimpleModel( { a: 3, b: 4 } );  // id: 2
				model3 = new SimpleModel( { a: 5, b: 6 } );  // id: 3
				
				var createRequest = new CreateRequest( { models: [ model1, model2, model3 ] } );
				proxy.create( createRequest );
				
				// We'll pretend that the create requests having been done from the Model class have
				// filled in the models' ID attributes as a result of the successful call to the proxy
				model1.set( 'id', 1 );
				model2.set( 'id', 2 );
				model3.set( 'id', 3 );
			} );
			
			
			it( "should remove a single model's record", function() {
				var destroyRequest = new DestroyRequest( { models: [ model2 ] } );  // note: model2 has id: 2
				proxy.destroy( destroyRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was destroyed, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 1, b: 2 } );
				expect( proxy.getRecord( 2 ) ).toBe( null );
				expect( proxy.getRecord( 3 ) ).toEqual( { id: 3, a: 5, b: 6 } );
				expect( proxy.getRecordIds() ).toEqual( [ "1", "3" ] );  // should have removed the number 2
			} );
			
			
			it( "should remove multiple models' records", function() {
				var destroyRequest = new DestroyRequest( { models: [ model2, model3 ] } );
				proxy.destroy( destroyRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was destroyed, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toEqual( { id: 1, a: 1, b: 2 } );
				expect( proxy.getRecord( 2 ) ).toBe( null );
				expect( proxy.getRecord( 3 ) ).toBe( null );
				expect( proxy.getRecordIds() ).toEqual( [ "1" ] );  // should have removed the numbers 2 and 3
			} );
			
			
			it( "should remove multiple models' records, even when the models are given out of order", function() {
				var destroyRequest = new DestroyRequest( { models: [ model2, model1 ] } );
				proxy.destroy( destroyRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Check that the record for the model was destroyed, and that bookkeeping was done
				expect( proxy.getRecord( 1 ) ).toBe( null );
				expect( proxy.getRecord( 2 ) ).toBe( null );
				expect( proxy.getRecord( 3 ) ).toEqual( { id: 3, a: 5, b: 6 } );
				expect( proxy.getRecordIds() ).toEqual( [ "3" ] );  // should have removed the numbers 1 and 2
			} );
			
		} );
		
		
		// -------------------------------------
		
		
		describe( 'setRecord()', function() {
			
			it( "should store a new model with the given `id` param (from a create()), along with its version number", function() {
				var model = new SimpleModel( { a: 1, b: 2 } );
				proxy.setRecord( model, 1 );
				
				var recordKey = proxy.getRecordKey( 1 ),
				    storedData = JSON.parse( storageMedium.getItem( recordKey ) );
				expect( storedData ).toEqual( { version: 1, data: { id: 1, a: 1, b: 2 } } );
				
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( recordKey );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( recordKey, '{"version":1,"data":{"id":1,"a":1,"b":2}}' );
			} );
			
			
			it( "should store an existing model that already has an `id` (from an update()), along with its version number", function() {
				var model = new SimpleModel( { id: 1, a: 1, b: 2 } );
				proxy.setRecord( model );
				
				var recordKey = proxy.getRecordKey( 1 ),
				    storedData = JSON.parse( storageMedium.getItem( recordKey ) );
				expect( storedData ).toEqual( { version: 1, data: { id: 1, a: 1, b: 2 } } );
				
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( recordKey );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( recordKey, '{"version":1,"data":{"id":1,"a":1,"b":2}}' );
			} );
			
			
			it( "should store a Model with a string ID attribute", function() {
				var model = new StringIdModel( { id: "model1", a: 1, b: 2 } );
				proxy.setRecord( model );
				
				var recordKey = proxy.getRecordKey( "model1" ),
				    storedData = JSON.parse( storageMedium.getItem( recordKey ) );
				expect( storedData ).toEqual( { version: 1, data: { id: "model1", a: 1, b: 2 } } );
				
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( recordKey );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( recordKey, '{"version":1,"data":{"id":"model1","a":1,"b":2}}' );
			} );
			
			
			it( "should only store a Model's persistent data", function() {
				var model = new ModelWithNonPersisted( { id: 1, a: 1, b: 2 } );
				proxy.setRecord( model );
				
				var recordKey = proxy.getRecordKey( 1 ),
				    storedData = JSON.parse( storageMedium.getItem( recordKey ) );
				expect( storedData ).toEqual( { version: 1, data: { id: 1, a: 1 } } );
				
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( recordKey );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( recordKey, '{"version":1,"data":{"id":1,"a":1}}' );
			} );
			
		} );
		
		
		describe( 'removeRecord()', function() {
			
			it( "should remove an record by ID", function() {
				// Set an initial model
				var model = new SimpleModel( { id: 10, a: 1, b: 2 } );
				proxy.setRecord( model );
				
				// Check initial condition
				expect( proxy.getRecord( 10 ) ).toEqual( { id: 10, a: 1, b: 2 } );
				
				proxy.removeRecord( 10 );
				expect( proxy.getRecord( 10 ) ).toBe( null );
			} );
		} );
		
		
		describe( 'getRecord()', function() {
			
			it( "should return `null` if there is no record for the given `id`", function() {
				expect( proxy.getRecord( 10 ) ).toBe( null );
			} );
			
			
			it( "should retrieve a record that has been set to WebStorage", function() {
				var model = new SimpleModel( { id: 10, a: 1, b: 2 } );
				proxy.setRecord( model, 10 );
				
				expect( proxy.getRecord( 10 ) ).toEqual( { id: 10, a: 1, b: 2 } );
			} );
			
		} );
		
		
		// -------------------------------------
		
		
		describe( 'setRecordIds()', function() {
			
			it( "should store an empty array when provided one", function() {
				proxy.setRecordIds( [] );
				
				expect( proxy.getRecordIds() ).toEqual( [] );
				
				// Make sure that both removeItem and setItem were called
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey() );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey(), '[]' );  // empty json array string
			} );
			
			
			it( "should store an array of record ids, in json format, and converting any numbers to strings for consistency with the possibility of string IDs", function() {
				proxy.setRecordIds( [ 1, 2, 3, "fourthId", "anIdWith,aComma" ] );
				
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3", "fourthId", "anIdWith,aComma" ] );
				
				// Make sure that both removeItem and setItem were called
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey() );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey(), '["1","2","3","fourthId","anIdWith,aComma"]' );  // json array string
			} );
			
		} );
		
		
		describe( 'getRecordIds()', function() {
			
			it( "should return an empty array when no records have been saved", function() {
				expect( proxy.getRecordIds() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the IDs that are currently stored (basically checking the conversion from serialized storage, and conversion to strings from numbers)", function() {
				proxy.setRecordIds( [ 1, 2, 3, "fourthId" ] );
				
				expect( proxy.getRecordIds() ).toEqual( [ "1", "2", "3", "fourthId" ] );
			} );
			
		} );
		
		
		describe( 'getNewId()', function() {

			it( "should retrieve the ID #1, and set the 'recordCounter' into the web storage medium when first used", function() {
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( null );  // initial condition
				
				var newId = proxy.getNewId();
				expect( newId ).toBe( 1 );
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( "1" );  // make sure it was stored
			} );

			
			it( "should retrieve the ID #2, and increase the 'recordCounter' in the web storage medium when used the second time", function() {
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( null );  // initial condition

				var newId;
				newId = proxy.getNewId();
				newId = proxy.getNewId();  // second time
				expect( newId ).toBe( 2 );
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( "2" );  // make sure it was stored
			} );
			
			
			it( "should return a new ID that hasn't been used yet, in the face of records that were stored with manually populated IDs", function() {
				// "Create" two records, with manually populated IDs 1 and 2
				var model1 = new SimpleModel( { id: 1, a: 1, b: 2 } ),
				    model2 = new SimpleModel( { id: 2, a: 3, b: 4 } );
				proxy.update( new UpdateRequest( { models: [ model1, model2 ] } ) );  // update() in this case performs a "create", since the models already have IDs
				
				// Check initial condition - no models were added by the create() method, and so the internal 
				// record counter hasn't been initialized/incremented
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( null );
				
				// Now perform the test
				var newId = proxy.getNewId();
				expect( newId ).toBe( 3 );  // make sure getNewId() skipped record IDs that already exist in storage
				expect( storageMedium.getItem( proxy.getRecordCounterKey() ) ).toBe( "3" );  // make sure it was stored
			} );
			
		} );
		
		
		describe( 'getRecordIdsKey()', function() {
			
			it( "should return the proxy's `storageKey`, along with '-recordIds'", function() {
				var proxy = new ConcreteWebStorageProxy( { storageKey: 'TestKey' } );
				expect( proxy.getRecordIdsKey() ).toBe( 'TestKey-recordIds' );
			} );
			
		} );
		
		
		describe( 'getRecordCounterKey()', function() {
			
			it( "should return the proxy's `storageKey`, along with '-recordCounter'", function() {
				var proxy = new ConcreteWebStorageProxy( { storageKey: 'TestKey' } );
				expect( proxy.getRecordCounterKey() ).toBe( 'TestKey-recordCounter' );
			} );
			
		} );
		
		
		describe( 'getRecordKey()', function() {
			
			it( "should throw an error if the method is called without any arguments", function() {
				expect( function() {
					proxy.getRecordKey();
				} ).toThrow( "`id` arg required" );
			} );
			
			it( "should return the proxy's `storageKey`, along with the provided ID to the method", function() {
				expect( proxy.getRecordKey( 0 ) ).toBe( 'TestKey-0' );
				expect( proxy.getRecordKey( 1 ) ).toBe( 'TestKey-1' );
				expect( proxy.getRecordKey( 999 ) ).toBe( 'TestKey-999' );
			} );
			
		} );
		
		
		describe( 'clear()', function() {
			
			beforeEach( function() {
				// Create some models for the test
				var model1 = new SimpleModel( { a: 1, b: 2 } ),  // id: 1
				    model2 = new SimpleModel( { a: 3, b: 4 } );  // id: 2
				
				var createRequest = new CreateRequest( { models: [ model1, model2 ] } );
				proxy.create( createRequest );
			} );
			
			
			it( "should remove all models, and bookkeeping properties", function() {
				var rec1key = proxy.getRecordKey( 1 ),
				    rec2key = proxy.getRecordKey( 2 ),
				    recordIdsKey = proxy.getRecordIdsKey(),
				    recordCounterKey = proxy.getRecordCounterKey();
				
				// Check initial conditions
				expect( storageMedium.getItem( rec1key ) ).not.toBe( null );
				expect( storageMedium.getItem( rec2key ) ).not.toBe( null );
				expect( storageMedium.getItem( recordIdsKey ) ).not.toBe( null );
				expect( storageMedium.getItem( recordCounterKey ) ).not.toBe( null );
				
				// Now Clear
				proxy.clear();
				expect( storageMedium.getItem( rec1key ) ).toBe( null );
				expect( storageMedium.getItem( rec2key ) ).toBe( null );
				expect( storageMedium.getItem( recordIdsKey ) ).toBe( null );
				expect( storageMedium.getItem( recordCounterKey ) ).toBe( null );
				
				// Check internal property on mocked storage medium to see if it's empty
				expect( _.isEmpty( storageMedium.data ) ).toBe( true );
			} );
			
		} );
		
		
		describe( 'migrate()', function() {
			var ModelV1 = Model.extend( {
				version : 1,
				attributes : [ 'id', 'a', 'b' ]
			} );
			var ModelV2 = Model.extend( {
				version : 2,
				attributes : [ 'id', 'c', 'd' ]
			} );
			var ModelV3 = Model.extend( {
				version : 3,
				attributes : [ 'id', 'e', 'f' ]
			} );
			
			var MigrationWebStorageProxy = ConcreteWebStorageProxy.extend( {
				migrate : function( version, data ) {
					switch( version ) {
						case 1 :
							data.c = data.a;
							data.d = data.b;
							delete data.a; 
							delete data.b;
							/* falls through */
						case 2 :
							data.e = data.c;
							data.f = data.d;
							delete data.c; 
							delete data.d;
					}
					return data;
				}
			} );
			
			var proxy;
			beforeEach( function() {
				proxy = new MigrationWebStorageProxy( { storageKey: 'TestKey' } );
			} );
			
			
			it( "should return a model stored from version 1, as version 3 (using the test implementation)", function() {
				// Create the record
				var modelV1 = new ModelV1( { a: 1, b: 2 } ),
				    createRequest = new CreateRequest( { models: [ modelV1 ] } );
				proxy.create( createRequest );  // synchronous - no need to add handlers to the returned promise
				
				// Now read the record
				var readRequest = new ReadRequest(),  // should get the model we just stored
				    resultRecords;
				
				readRequest.done( function( resultSet ) { resultRecords = resultSet.getRecords(); } );
				proxy.read( readRequest );  // synchronous
				
				expect( resultRecords.length ).toBe( 1 );
				expect( resultRecords[ 0 ] ).toEqual( { id: 1, e: 1, f: 2 } );
			} );
		} );
		
	} );
	
} );