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
				}
			}
		]
	} ) );
} );