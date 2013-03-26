/*global define, window, jQuery, Ext, Y, JsMockito, tests */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Ajax',
	'data/persistence/reader/Reader',
	'data/persistence/operation/Read',
	'data/persistence/operation/Write'
], function( _, Class, Model, ResultSet, AjaxProxy, Reader, ReadOperation, WriteOperation ) {
	
	// Used in the tests
	var ConcreteReader = Reader.extend( {
		convertRaw : function( rawData ) { return rawData; }
	} );
	
	
	tests.unit.persistence.proxy.add( new Ext.test.TestSuite( {
		name: 'Ajax',
		
		
		items : [
		
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
						},
						
						
						"read() should call the ajax function with the correct url when a single model is being loaded" : function() {
							JsMockito.when( this.operation ).getModelId().thenReturn( 1 );
							var providedUrl;
							
							var testData = { attribute1: 'value1', attribute2: 'value2' };
							var TestProxy = AjaxProxy.extend( {
								ajax : function( options ) {
									providedUrl = options.url;
									return new jQuery.Deferred().promise();
								}
							} );
							
							var proxy = new TestProxy( {
								url : '/testUrl',
								idParam : 'id'
							} );
							proxy.read( this.operation );
							Y.Assert.areSame( '/testUrl?id=1', providedUrl );
						},
						
						
						"read() should populate the provided ReadOperation with a ResultSet upon a successful ajax request" : function() {
							var resultSet;
							
							JsMockito.when( this.operation ).getModelId().thenReturn( 1 );
							JsMockito.when( this.reader ).read().then( function( data ) {
								return ( resultSet = new ResultSet( { records: data } ) );
							} );
							
							var testData = { attribute1: 'value1', attribute2: 'value2' };
							
							var TestProxy = AjaxProxy.extend( {
								ajax : function( options ) {
									return new jQuery.Deferred().resolve( testData ).promise();
								},
								reader : this.reader
							} );
							
							var proxy = new TestProxy( {
								url : '/testUrl'
							} );
							proxy.read( this.operation );
							
							Y.Assert.areSame( resultSet.getRecords()[ 0 ], testData, "The records provided to the ResultSet should have been the testData" );
							
							try {
								JsMockito.verify( this.operation ).setResultSet( resultSet );
							} catch( e ) {
								Y.Assert.fail( e.message || e );
							}
						}
					}
				]
			},
			
			
			// -------------------------
			
			
			{
				/*
				 * Test buildUrl()
				 */
				name: 'Test buildUrl()',
				
				"buildUrl() should simply return the base url if no modelId is set on the ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl'
					} );
					var operation = new ReadOperation();
					
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read', operation ) );
				},
				
				
				"buildUrl() should return the base url + the id param if a modelId is set on the ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl'
					} );
					var operation = new ReadOperation( { modelId: 1 } );
					
					Y.Assert.areSame( '/testUrl?id=1', proxy.buildUrl( 'read', operation ) );
				},
				
				
				"buildUrl() should return the base url + any params passed on the Operation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl'
					} );
					
					var readOperation = new ReadOperation( { 
						modelId: 1,
						params : {
							p1: "value1",
							p2: 2
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=value1&p2=2&id=1', proxy.buildUrl( 'read', readOperation ) );
					
					var writeOperation = new WriteOperation( { 
						params : {
							p1: "value1",
							p2: 2
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=value1&p2=2', proxy.buildUrl( 'update', writeOperation ) );
				},
				
				
				"buildUrl() should return the base url + configured extraParams + any params passed on the Operation, where params on the Operation override extraParams of the same name" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						extraParams : {
							p1: "value1",
							p2: "value2"
						}
					} );
					
					var readOperation = new ReadOperation( { 
						modelId: 1,
						params : {
							p1: "overridden_value1",
							p3: "value3"
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=overridden_value1&p2=value2&p3=value3&id=1', proxy.buildUrl( 'read', readOperation ) );
					
					var writeOperation = new WriteOperation( { 
						params : {
							p1: "overridden_value1",
							p3: "value3"
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=overridden_value1&p2=value2&p3=value3', proxy.buildUrl( 'update', writeOperation ) );
				},
				
				
				"buildUrl() should url encode both its extraParam and Operation-level params' values" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						extraParams : {
							p1: "a b"
						}
					} );
					
					var readOperation = new ReadOperation( { 
						modelId: 1,
						params : {
							p2: "a@b"
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=a%20b&p2=a%40b&id=1', proxy.buildUrl( 'read', readOperation ) );
					
					var writeOperation = new WriteOperation( { 
						params : {
							p2: "a@b"
						}
					} );
					Y.Assert.areSame( '/testUrl?p1=a%20b&p2=a%40b', proxy.buildUrl( 'update', writeOperation ) );
				},
				
				
				"buildUrl() should add the `pageParam` if it is configured, and a page of data to load is provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						pageParam : 'pageNum'
					} );
					
					var readOperation = new ReadOperation( { 
						page : 5
					} );
					Y.Assert.areSame( '/testUrl?pageNum=5', proxy.buildUrl( 'read', readOperation ) );
				},
				
				
				"buildUrl() should *not* add the `pageParam` if it is configured, but a page of data to load is not provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						pageParam : 'pageNum'
					} );
					
					var readOperation = new ReadOperation( { 
						//page : 0   -- no page configured
					} );
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read', readOperation ) );
				},
				
				
				"buildUrl() should *not* add the `pageParam` if it is not configured, even if a page of data to load is provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl'
						//pageParam : 'pageNum'  -- not configured
					} );
					
					var readOperation = new ReadOperation( { 
						page : 5
					} );
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read', readOperation ) );
				},
				
				
				"buildUrl() should add the `pageSizeParam` if it is configured, and a page of data to load is provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						pageParam : 'pageNum',
						pageSizeParam : 'pageSize'
					} );
					
					var readOperation = new ReadOperation( { 
						page  : 5,
						pageSize : 50
					} );
					Y.Assert.areSame( '/testUrl?pageNum=5&pageSize=50', proxy.buildUrl( 'read', readOperation ) );
				},
				
				
				"buildUrl() should *not* add the `pageSizeParam` if it is configured, but a page of data to load is not provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						pageParam : 'pageNum',
						pageSizeParam : 'pageSize'
					} );
					
					var readOperation = new ReadOperation( { 
						//page : 0   -- no page configured
						pageSize : 50
					} );
					Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read', readOperation ) );
				},
				
				
				"buildUrl() should *not* add the `pageSizeParam` if it is not configured, even if a page of data to load is provided on a ReadOperation" : function() {
					var proxy = new AjaxProxy( {
						url : '/testUrl',
						pageParam : 'pageNum'
						//pageSizeParam : 'pageSize'  -- not configured,
					} );
					
					var readOperation = new ReadOperation( { 
						page : 5,
						pageSize : 50
					} );
					Y.Assert.areSame( '/testUrl?pageNum=5', proxy.buildUrl( 'read', readOperation ) );
				}
			}
		]
	} ) );
} );