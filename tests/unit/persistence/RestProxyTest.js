/*global define, window, jQuery, Ext, Y, JsMockito, tests */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Rest',
	'data/persistence/reader/Reader',
	'data/persistence/operation/Read',
	'data/persistence/operation/Write'
], function( _, Class, Model, ResultSet, RestProxy, Reader, ReadOperation, WriteOperation ) {
	
	// Used in the tests
	var ConcreteReader = Reader.extend( {
		convertRaw : function( rawData ) { return rawData; }
	} );
	
	
	tests.unit.persistence.add( new Ext.test.TestSuite( {
		name: 'RestProxy',
		
		
		items : [
		
			{
				/*
				 * Test create()
				 */
				name: "Test create",
				ttype: 'testsuite',
				
				items : [
					{
						name: 'General create() tests',
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							this.reader = JsMockito.mock( ConcreteReader );
							this.operation = JsMockito.mock( WriteOperation );
						},
						
						
						"create() should populate the provided WriteOperation with any response data upon a successful ajax request" : function() {
							var testData = { attribute1: 'value1', attribute2: 'value2' };
							var TestProxy = RestProxy.extend( {
								ajax : function( options ) { 
									return new jQuery.Deferred().resolve( testData ).promise();
								},
								reader : this.reader
							} );
							var proxy = new TestProxy();
							
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
							
							var resultSet;
							JsMockito.when( this.reader ).read().then( function( data ) {
								return ( resultSet = new ResultSet( { records: data } ) );
							} );
							proxy.create( this.operation );
							
							Y.Assert.areSame( resultSet.getRecords()[ 0 ], testData, "The records provided to the ResultSet should have been the testData" );
							
							try {
								JsMockito.verify( this.operation ).setResultSet( resultSet );
							} catch( e ) {
								Y.Assert.fail( "The model should have had its data set to the testData. msg = " + ( e.message || e ) );
							}
						}
					},
					
					{
						name : "create()'s HTTP method tests",
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
						
						"By default, the ajax function should be called with the HTTP method 'POST'" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								}
							} );
							var proxy = new TestProxy();
							
							proxy.create( this.operation );
							Y.Assert.areSame( 'POST', httpMethod );
						},
						
						
						"The HTTP method should be overridable via the actionMethods config" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								},
								
								actionMethods : {
									create : 'PUT'  // override
								}
							} );
							var proxy = new TestProxy();
							
							proxy.create( this.operation );
							Y.Assert.areSame( 'PUT', httpMethod );
						}
					}
				]
			},
						
		
			{
				/*
				 * Test read()
				 */
				name: "Test read",
				ttype: 'testsuite',
				
				items : [
					{
						name: 'General read() tests',
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							this.reader = JsMockito.mock( ConcreteReader );
							
							this.operation = JsMockito.mock( ReadOperation );
							JsMockito.when( this.operation ).getModelId().thenReturn( 1 );
						},
						
						
						"read() should populate the provided ReadOperation with the data upon a successful ajax request" : function() {
							var testData = { attribute1: 'value1', attribute2: 'value2' };
							var TestProxy = RestProxy.extend( {
								ajax : function( options ) { 
									return new jQuery.Deferred().resolve( testData ).promise();
								},
								reader : this.reader
							} );
							
							var resultSet;
							JsMockito.when( this.reader ).read().then( function( data ) {
								return ( resultSet = new ResultSet( { records: data } ) );
							} );
							
							var proxy = new TestProxy();
							proxy.read( this.operation );
							
							Y.Assert.areSame( resultSet.getRecords()[ 0 ], testData, "The records provided to the ResultSet should have been the testData" );
							
							try {
								JsMockito.verify( this.operation ).setResultSet( resultSet );
							} catch( e ) {
								Y.Assert.fail( "The model should have had its data set to the testData" );
							}
						}
					},
					
					
					{
						name : "read()'s HTTP method tests",
						
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( ReadOperation );
							JsMockito.when( this.operation ).getModelId().thenReturn( 1 );
						},
						
						"By default, the ajax function should be called with the HTTP method 'GET'" : function() {
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								}
							} );
							
							var proxy = new TestProxy();
							proxy.read( this.operation );
							
							Y.Assert.areSame( 'GET', httpMethod );
						},
						
						
						"The HTTP method should be overridable via the actionMethods config" : function() {
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								},
								
								actionMethods : {
									read : 'POST'  // override
								}
							} );
							
							var proxy = new TestProxy();
							proxy.read( this.operation );
							
							Y.Assert.areSame( 'POST', httpMethod );
						}
					}
				]
			},
			
			
			
			
			{
				/*
				 * Test update()
				 */
				name: "Test update()",
				ttype: 'testsuite',
				
				items : [
					{
						name : "General update() tests",
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
						
						"update() should NOT actually call the ajax method when no attributes have been changed" : function() {
							var ajaxCallCount = 0;
							var TestProxy = RestProxy.extend( {
								ajax : function() {
									ajaxCallCount++;
									return new jQuery.Deferred().promise();
								}
							} );
							
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( {} );
							
							var proxy = new TestProxy();
							proxy.update( this.operation );
							
							Y.Assert.areSame( 0, ajaxCallCount, "The proxy's ajax() method should not have not been called, since there are no changes" );
						},
						
						
						"update() should in fact call the ajax method when attributes have been changed" : function() {
							var ajaxCallCount = 0;
							var TestProxy = RestProxy.extend( {
								ajax : function() {
									ajaxCallCount++;
									return new jQuery.Deferred().promise();
								}
							} );
							
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var proxy = new TestProxy();
							proxy.update( this.operation );
							
							Y.Assert.areSame( 1, ajaxCallCount, "The proxy's ajax() method should have been called, since there are changes to persist" );
						}
					},
						
					
					{
						name : "Test update() promise resolution/rejection",
						
						setUp : function() {
							this.ajaxCallCount = 0;
							this.deferred = new jQuery.Deferred();
							
							this.TestProxy = RestProxy.extend( {
								ajax: jQuery.proxy( function( options ) { 
									this.ajaxCallCount++;
									
									return this.deferred.promise();
								}, this )
							} );
							
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
							
						"The promise returned by the proxy should be resolved if no attributes have been changed, and it does not need to do its ajax request" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( {} );
							
							var successCallCount = 0,
							    completeCallCount = 0;
							    
							var proxy = new this.TestProxy();
							proxy.update( this.operation )
								.done( function() { successCallCount++; } )
								.always( function() { completeCallCount++; } );
							
							Y.Assert.areSame( 0, this.ajaxCallCount, "The ajax method should not have been called" );
							Y.Assert.areSame( 1, successCallCount, "The promise should have been resolved even though there are no changes and the proxy didn't need to persist anything" );
							Y.Assert.areSame( 1, completeCallCount, "The promise should have been resolved even though there are no changes and the proxy didn't need to persist anything" );
						},
						
						
						"The promise returned by the proxy should be resolved if the ajax request is successful" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var successCallCount = 0,
							    completeCallCount = 0;
							    
							var proxy = new this.TestProxy();
							proxy.update( this.operation )
								.done( function() { successCallCount++; } )
								.always( function() { completeCallCount++; } );
							
							// Pretend the ajax request is successful
							this.deferred.resolve( this.operation );
							
							Y.Assert.areSame( 1, successCallCount, "The promise should have been resolved" );
							Y.Assert.areSame( 1, completeCallCount, "The promise should have been resolved" );
						},
						
						
						"The 'error' and 'complete' callbacks provided to update() should be called if the ajax request fails" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var errorCallCount = 0,
							    completeCallCount = 0;
							
							var proxy = new this.TestProxy();
							proxy.update( this.operation )
								.fail( function() { errorCallCount++; } )
								.always( function() { completeCallCount++; } );
							
							// Pretend the ajax request failed
							this.deferred.reject( this.operation );
							
							Y.Assert.areSame( 1, errorCallCount, "The promise should have been rejected" );
							Y.Assert.areSame( 1, completeCallCount, "The promise should have been rejected" );
						}
					},
						
						
					{
						name : "HTTP method tests",
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
						
						"By default, the ajax function should be called with the HTTP method 'PUT'" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								}
							} );
							
							var proxy = new TestProxy();
							proxy.update( this.operation );
							
							Y.Assert.areSame( 'PUT', httpMethod );
						},
						
						
						"The HTTP method should be overridable via the actionMethods config" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								},
								
								actionMethods : {
									update : 'POST'  // override
								}
							} );
							
							var proxy = new TestProxy();
							proxy.update( this.operation );
							
							Y.Assert.areSame( 'POST', httpMethod );
						}
					},
					
					
					
					{
						/*
						 * Test incremental updates
						 */
						name : "Test incremental updates",
						
						setUp : function() {						
							this.mockModel = JsMockito.mock( Model );
							JsMockito.when( this.mockModel ).getData( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1', attribute2: 'value2' } );
							JsMockito.when( this.mockModel ).getChanges( /*{ persistedOnly: true, raw: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute2: 'value2' } );  // 'attribute2' is the "change"
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.mockModel ] );
						},
						
						
						"update() should provide the full set of data to the ajax method if the proxy is not set to do incremental updates" : function() {
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
							proxy.update( this.operation );
							
							Y.Assert.areEqual( 2, _.keys( dataPersisted ).length, "The dataPersisted have exactly 2 keys, one for each of the attributes in the model" );
							Y.ObjectAssert.ownsKeys( [ 'attribute1', 'attribute2' ], dataPersisted );
							Y.Assert.areEqual( 'value1', dataPersisted.attribute1 );
							Y.Assert.areEqual( 'value2', dataPersisted.attribute2 );
						},
						
						
						"update() should provide only the changed data if the proxy is set to do incremental updates" : function() {
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
							proxy.update( this.operation );
							
							Y.Assert.areEqual( 1, _.keys( dataPersisted ).length, "The dataPersisted have exactly 1 key, the one that was changed" );
							Y.ObjectAssert.ownsKeys( [ 'attribute2' ], dataPersisted );
							Y.Assert.areEqual( 'value2', dataPersisted.attribute2 );
						}
					}
				]
			},
			
			
			{
				/*
				 * Test destroy()
				 */
				name : 'Test destroy',
				ttype : 'testsuite',
				
				
				items : [
					{
						name : "Test destroy()'s callbacks", 
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
							
						"The promise returned by the proxy should be resolved if the ajax request is successful" : function() {
							var operation = this.operation;
							var ajaxFn = function( options ) { 
								return new jQuery.Deferred().resolve( operation ).promise();
							};
							var TestProxy = Class.extend( RestProxy, {
								ajax: ajaxFn
							} );
							
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							
							var successCallCount = 0,
							    completeCallCount = 0;
							
							var proxy = new TestProxy();
							proxy.destroy( operation )
								.done( function() { successCallCount++; } )
								.always( function() { completeCallCount++; } );
								
							Y.Assert.areSame( 1, successCallCount, "The 'success' callback provided destroy() should have been called" );
							Y.Assert.areSame( 1, completeCallCount, "The 'complete' callback provided destroy() should have been called" );
						},
						
						
						"The promise returned by the proxy should be rejected if the ajax request fails" : function() {
							var operation = this.operation;
							var ajaxFn = function( options ) { 
								return new jQuery.Deferred().reject( operation ).promise();
							};
							var TestProxy = Class.extend( RestProxy, {
								ajax: ajaxFn
							} );
							
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							
							var errorCallCount = 0,
							    completeCallCount = 0;
							
							var proxy = new TestProxy();
							proxy.destroy( operation )
								.fail( function() { errorCallCount++; } )
								.always( function() { completeCallCount++; } );
							
							Y.Assert.areSame( 1, errorCallCount, "The 'error' callback provided destroy() should have been called" );
							Y.Assert.areSame( 1, completeCallCount, "The 'complete' callback provided destroy() should have been called" );
						}
					},
										
						
					{
						name : "destroy()'s HTTP method tests",
						
						setUp : function() {
							this.model = JsMockito.mock( Model );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getModels().thenReturn( [ this.model ] );
						},
						
						
						"By default, the ajax function should be called with the HTTP method 'DELETE'" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								}
							} );
							
							var proxy = new TestProxy();
							proxy.destroy( this.operation );
							
							Y.Assert.areSame( 'DELETE', httpMethod );
						},
						
						
						"The HTTP method should be overridable via the actionMethods config" : function() {
							JsMockito.when( this.model ).getChanges( /*{ persistedOnly: true, raw: true } Unfortunately, JsMockito won't match this*/ ).thenReturn( { attribute1: 'value1' } );
							
							var httpMethod = "";
							var TestProxy = Class.extend( RestProxy, {
								ajax: function( options ) {
									httpMethod = options.type;
									return new jQuery.Deferred().promise();
								},
								
								actionMethods : {
									destroy : 'POST'  // override
								}
							} );
							
							var proxy = new TestProxy();
							proxy.destroy( this.operation );
							
							Y.Assert.areSame( 'POST', httpMethod );
						}
					}
				]
			},
			
			
			{
				/*
				 * Test buildUrl()
				 */
				name: 'Test buildUrl()',
				
				
				"buildUrl() should handle a urlRoot without a trailing slash" : function() {
					var proxy = new RestProxy( {
						urlRoot : '/testUrl',
						appendId : false
					} );
					
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );
				},
	
	
				"buildUrl() should handle a urlRoot with a trailing slash" : function() {
					var proxy = new RestProxy( {
						urlRoot : '/testUrl/',
						appendId : false
					} );
					
					Y.Assert.areSame( '/testUrl/', proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
					Y.Assert.areSame( '/testUrl/', proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
					Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );
				}
			}
		]
	} ) );
} );