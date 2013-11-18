/*global define, window, jQuery, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Rest',
	'data/persistence/reader/Reader',
	
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy'
], function( _, Class, Model, ResultSet, RestProxy, Reader, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest ) {
	
	// Used in the tests
	var ConcreteReader = Reader.extend( {
		convertRaw : function( rawData ) { return rawData; }
	} );
	
	
	describe( "data.persistence.proxy.Rest", function() {
		
		describe( 'create()', function() {
			
			describe( "General create() tests", function() {
				var model,
				    reader,
				    request;
				
				beforeEach( function() {
					model = JsMockito.mock( Model );
					reader = JsMockito.mock( ConcreteReader );
					request = JsMockito.mock( CreateRequest );
				} );
				
				
				it( "create() should populate the provided WriteRequest with any response data upon a successful ajax request", function() {
					var testData = { attribute1: 'value1', attribute2: 'value2' };
					var TestProxy = RestProxy.extend( {
						ajax : function( options ) { 
							return new jQuery.Deferred().resolve( testData ).promise();
						},
						reader : reader
					} );
					var proxy = new TestProxy();
					
					JsMockito.when( request ).getModels().thenReturn( [ model ] );
					
					var resolvedResultSet;
					JsMockito.when( reader ).read().then( function( data ) {
						return new ResultSet( { records: data } );
					} );
					var promise = proxy.create( request )
						.done( function( resultSet ) { resolvedResultSet = resultSet; } );
					
					expect( promise.state() ).toBe( 'resolved' );
					expect( resolvedResultSet.getRecords()[ 0 ] ).toBe( testData );
				} );
				
			} );
			
			
			describe( "create()'s HTTP method tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( CreateRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "By default, the ajax function should be called with the HTTP method 'POST'", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						}
					} );
					var proxy = new TestProxy();
					
					proxy.create( thisSuite.request );
					expect( httpMethod ).toBe( 'POST' );
				} );
				
				
				it( "The HTTP method should be overridable via the `createMethod` config", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						},
						
						createMethod : 'PUT'  // override
					} );
					var proxy = new TestProxy();
					
					proxy.create( thisSuite.request );
					expect( httpMethod ).toBe( 'PUT' );
				} );
				
			} );
			
		} );
		
		
		describe( 'read()', function() {
			
			describe( "General read() tests", function() {
				var model,
				    reader,
				    request;
				
				beforeEach( function() {
					model = JsMockito.mock( Model );
					reader = JsMockito.mock( ConcreteReader );
					
					request = JsMockito.mock( ReadRequest );
					JsMockito.when( request ).getModelId().thenReturn( 1 );
				} );
				
				
				it( "read() should populate the provided ReadRequest with the data upon a successful ajax request", function() {
					var testData = { attribute1: 'value1', attribute2: 'value2' };
					var TestProxy = RestProxy.extend( {
						ajax : function( options ) { 
							return new jQuery.Deferred().resolve( testData ).promise();
						},
						reader : reader
					} );
					
					JsMockito.when( reader ).read().then( function( data ) {
						return new ResultSet( { records: data } );
					} );
					
					var proxy = new TestProxy(),
					    resolvedResultSet;
					
					var promise = proxy.read( request )
						.done( function( resultSet ) { resolvedResultSet = resultSet; } );
					
					expect( promise.state() ).toBe( 'resolved' );
					expect( resolvedResultSet.getRecords()[ 0 ] ).toBe( testData );
				} );
				
			} );
			
			
			describe( "read()'s HTTP method tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( ReadRequest );
					JsMockito.when( thisSuite.request ).getModelId().thenReturn( 1 );
				} );
				
				
				it( "By default, the ajax function should be called with the HTTP method 'GET'", function() {
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						}
					} );
					
					var proxy = new TestProxy();
					proxy.read( thisSuite.request );
					
					expect( httpMethod ).toBe( 'GET' );
				} );
				
				
				it( "The HTTP method should be overridable via the `readMethod` config", function() {
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						},
						
						readMethod : 'POST'  // override
					} );
					
					var proxy = new TestProxy();
					proxy.read( thisSuite.request );
					
					expect( httpMethod ).toBe( 'POST' );
				} );
				
			} );
			
		} );
		
		
		describe( "Test update()", function() {
			
			describe( "General update() tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( UpdateRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "update() should NOT actually call the ajax method when no attributes have been changed", function() {
					var ajaxCallCount = 0;
					var TestProxy = RestProxy.extend( {
						ajax : function() {
							ajaxCallCount++;
							return new jQuery.Deferred().promise();
						}
					} );
					
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( {} );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( ajaxCallCount ).toBe( 0 );  // orig YUI Test err msg: "The proxy's ajax() method should not have not been called, since there are no changes"
				} );
				
				
				it( "update() should in fact call the ajax method when attributes have been changed", function() {
					var ajaxCallCount = 0;
					var TestProxy = RestProxy.extend( {
						ajax : function() {
							ajaxCallCount++;
							return new jQuery.Deferred().promise();
						}
					} );
					
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( ajaxCallCount ).toBe( 1 );  // orig YUI Test err msg: "The proxy's ajax() method should have been called, since there are changes to persist"
				} );
				
			} );
			
			
			describe( "Test update() promise resolution/rejection", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.ajaxCallCount = 0;
					thisSuite.deferred = new jQuery.Deferred();
					
					thisSuite.TestProxy = RestProxy.extend( {
						ajax: jQuery.proxy( function( options ) { 
							thisSuite.ajaxCallCount++;
							
							return thisSuite.deferred.promise();
						}, this )
					} );
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( UpdateRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "The promise returned by the proxy should be resolved if no attributes have been changed, and it does not need to do its ajax request", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( {} );
					
					var successCallCount = 0,
					    completeCallCount = 0;
					    
					var proxy = new thisSuite.TestProxy();
					proxy.update( thisSuite.request )
						.done( function() { successCallCount++; } )
						.always( function() { completeCallCount++; } );
					
					expect( thisSuite.ajaxCallCount ).toBe( 0 );  // orig YUI Test err msg: "The ajax method should not have been called"
					expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been resolved even though there are no changes and the proxy didn't need to persist anything"
					expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been resolved even though there are no changes and the proxy didn't need to persist anything"
				} );
				
				
				it( "The promise returned by the proxy should be resolved if the ajax request is successful", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var successCallCount = 0,
					    completeCallCount = 0;
					    
					var proxy = new thisSuite.TestProxy();
					proxy.update( thisSuite.request )
						.done( function() { successCallCount++; } )
						.always( function() { completeCallCount++; } );
					
					// Pretend the ajax request is successful
					thisSuite.deferred.resolve( thisSuite.request );
					
					expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been resolved"
					expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been resolved"
				} );
				
				
				it( "The 'error' and 'complete' callbacks provided to update() should be called if the ajax request fails", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var errorCallCount = 0,
					    completeCallCount = 0;
					
					var proxy = new thisSuite.TestProxy();
					proxy.update( thisSuite.request )
						.fail( function() { errorCallCount++; } )
						.always( function() { completeCallCount++; } );
					
					// Pretend the ajax request failed
					thisSuite.deferred.reject( thisSuite.request );
					
					expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been rejected"
					expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The promise should have been rejected"
				} );
				
			} );
			
			
			describe( "HTTP method tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( UpdateRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "By default, the ajax function should be called with the HTTP method 'PUT'", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						}
					} );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( httpMethod ).toBe( 'PUT' );
				} );
				
				
				it( "The HTTP method should be overridable via the `updateMethod` config", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						},
						
						updateMethod : 'POST'  // override
					} );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( httpMethod ).toBe( 'POST' );
				} );
				
			} );
			
			
			describe( "Test incremental updates", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.mockModel = JsMockito.mock( Model );
					JsMockito.when( thisSuite.mockModel ).getData( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1', attribute2: 'value2' } );
					JsMockito.when( thisSuite.mockModel ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute2: 'value2' } );  // 'attribute2' is the "change"
					
					thisSuite.request = JsMockito.mock( UpdateRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.mockModel ] );
				} );
				
				
				it( "update() should provide the full set of data to the ajax method if the proxy is not set to do incremental updates", function() {
					var dataPersisted;
					var ajaxFn = function( options ) {
						dataPersisted = JSON.parse( options.data );  // the data is fed as a JSON encoded string
						return new jQuery.Deferred().promise();
					};
					var TestProxy = RestProxy.extend( {
						ajax : ajaxFn,
						incremental: false
					} );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( _.keys( dataPersisted ).length ).toEqual( 2 );  // orig YUI Test err msg: "The dataPersisted have exactly 2 keys, one for each of the attributes in the model"
					expect( dataPersisted.hasOwnProperty( 'attribute1' ) ).toBe( true );expect( dataPersisted.hasOwnProperty( 'attribute2' ) ).toBe( true );
					expect( dataPersisted.attribute1 ).toEqual( 'value1' );
					expect( dataPersisted.attribute2 ).toEqual( 'value2' );
				} );
				
				
				it( "update() should provide only the changed data if the proxy is set to do incremental updates", function() {
					var dataPersisted;
					var ajaxFn = function( options ) {
						dataPersisted = JSON.parse( options.data );  // the data is fed as a JSON encoded string
						return new jQuery.Deferred().promise();
					};
					var TestProxy = RestProxy.extend( {
						ajax : ajaxFn,
						incremental: true
					} );
					
					var proxy = new TestProxy();
					proxy.update( thisSuite.request );
					
					expect( _.keys( dataPersisted ).length ).toEqual( 1 );  // orig YUI Test err msg: "The dataPersisted have exactly 1 key, the one that was changed"
					expect( dataPersisted.hasOwnProperty( 'attribute2' ) ).toBe( true );
					expect( dataPersisted.attribute2 ).toEqual( 'value2' );
				} );
				
			} );
			
		} );
		
		
		describe( "Test destroy", function() {
			
			describe( "Test destroy()'s callbacks", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( DestroyRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "The promise returned by the proxy should be resolved if the ajax request is successful", function() {
					var request = thisSuite.request;
					var ajaxFn = function( options ) { 
						return new jQuery.Deferred().resolve( request ).promise();
					};
					var TestProxy = Class.extend( RestProxy, {
						ajax: ajaxFn
					} );
					
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					
					var successCallCount = 0,
					    completeCallCount = 0;
					
					var proxy = new TestProxy();
					proxy.destroy( request )
						.done( function() { successCallCount++; } )
						.always( function() { completeCallCount++; } );
						
					expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'success' callback provided destroy() should have been called"
					expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'complete' callback provided destroy() should have been called"
				} );
				
				
				it( "The promise returned by the proxy should be rejected if the ajax request fails", function() {
					var request = thisSuite.request;
					var ajaxFn = function( options ) { 
						return new jQuery.Deferred().reject( request ).promise();
					};
					var TestProxy = Class.extend( RestProxy, {
						ajax: ajaxFn
					} );
					
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					
					var errorCallCount = 0,
					    completeCallCount = 0;
					
					var proxy = new TestProxy();
					proxy.destroy( request )
						.fail( function() { errorCallCount++; } )
						.always( function() { completeCallCount++; } );
					
					expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'error' callback provided destroy() should have been called"
					expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'complete' callback provided destroy() should have been called"
				} );
				
			} );
			
			
			describe( "destroy()'s HTTP method tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					
					thisSuite.request = JsMockito.mock( DestroyRequest );
					JsMockito.when( thisSuite.request ).getModels().thenReturn( [ thisSuite.model ] );
				} );
				
				
				it( "By default, the ajax function should be called with the HTTP method 'DELETE'", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						}
					} );
					
					var proxy = new TestProxy();
					proxy.destroy( thisSuite.request );
					
					expect( httpMethod ).toBe( 'DELETE' );
				} );
				
				
				it( "The HTTP method should be overridable via the `destroyMethod` config", function() {
					JsMockito.when( thisSuite.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
					
					var httpMethod = "";
					var TestProxy = Class.extend( RestProxy, {
						ajax: function( options ) {
							httpMethod = options.type;
							return new jQuery.Deferred().promise();
						},
						
						destroyMethod : 'POST'  // override
					} );
					
					var proxy = new TestProxy();
					proxy.destroy( thisSuite.request );
					
					expect( httpMethod ).toBe( 'POST' );
				} );
				
			} );
			
		} );
		
		
		describe( "Test buildUrl()", function() {
			
			it( "buildUrl() should handle a urlRoot without a trailing slash", function() {
				var proxy = new RestProxy( {
					urlRoot : '/testUrl',
					appendId : false
				} );
				
				expect( proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
				expect( proxy.buildUrl( 'read' ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
				expect( proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
				expect( proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
				expect( proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
			} );
			
			
			it( "buildUrl() should handle a urlRoot with a trailing slash", function() {
				var proxy = new RestProxy( {
					urlRoot : '/testUrl/',
					appendId : false
				} );
				
				expect( proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
				expect( proxy.buildUrl( 'read' ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
				expect( proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
				expect( proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
				expect( proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
			} );
			
		} );
		
	} );
} );