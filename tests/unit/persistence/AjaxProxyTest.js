/*global define, window, jQuery, Ext, Y, JsMockito, tests */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/AjaxProxy',
	'data/persistence/operation/ReadOperation',
	'data/persistence/operation/WriteOperation'
], function( _, Class, Model, AjaxProxy, ReadOperation, WriteOperation ) {
	
	tests.unit.persistence.add( new Ext.test.TestSuite( {
		name: 'AjaxProxy',
		
		
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
						
						
						"read() should populate the provided ReadOperation with the data upon a successful ajax request" : function() {
							JsMockito.when( this.operation ).getModelId().thenReturn( 1 );
							
							var testData = { attribute1: 'value1', attribute2: 'value2' };
							var TestProxy = AjaxProxy.extend( {
								ajax : function( options ) {
									return new jQuery.Deferred().resolve( testData ).promise();
								}
							} );
							
							var proxy = new TestProxy( {
								url : '/testUrl'
							} );
							proxy.read( this.operation );
							
							try {
								JsMockito.verify( this.operation ).setData( testData );
							} catch( e ) {
								Y.Assert.fail( "The model should have had its data set to the testData" );
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