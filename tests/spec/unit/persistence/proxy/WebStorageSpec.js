/*global define, window, jQuery, _, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/WebStorage'
], function( _, Class, Model, ResultSet, WebStorageProxy ) {
	
	describe( 'data.persistence.proxy.WebStorage', function() {

		// Some Model classes to use
		var SimpleModel = Model.extend( {
			attributes : [ 'id', 'a', 'b' ]
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
			constructor : function() { this.store = {}; },
			getItem     : function( itemName ) { return this.store[ itemName ] || null; },
			setItem     : function( itemName, value ) { this.store[ itemName ] = String( value ); },  // WebStorage (localStorage/sessionStorage) always stores as a string
			removeItem  : function( itemName ) { delete this.store[ itemName ]; }
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
			
			
			it( "should store an array of record ids, in json format", function() {
				proxy.setRecordIds( [ 1, 2, 3 ] );
				
				expect( proxy.getRecordIds() ).toEqual( [ 1, 2, 3 ] );
				
				// Make sure that both removeItem and setItem were called
				expect( storageMedium.removeItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey() );
				expect( storageMedium.setItem ).toHaveBeenCalledWith( proxy.getRecordIdsKey(), '[1,2,3]' );  // json array string
			} );
			
		} );
		
		
		describe( 'getRecordIds()', function() {
			
			it( "should return an empty array when no records have been saved", function() {
				expect( proxy.getRecordIds() ).toEqual( [] );
			} );
			
			
			it( "should return an array of the IDs that are currently stored (basically checking the conversion from serialized storage)", function() {
				proxy.setRecordIds( [ 1, 2, 3 ] );
				
				expect( proxy.getRecordIds() ).toEqual( [ 1, 2, 3 ] );
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
		
		
		
		// TODO:
		describe( 'clear()', function() {
			
			
		} );
		
	} );
	
} );