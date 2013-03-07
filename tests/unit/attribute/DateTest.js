/*global define, Ext, Y, JsMockito, tests */
define( [
	'data/Model',
	'data/attribute/Date'
], function( Model, DateAttribute ) {
	
	tests.unit.attribute.add( new Ext.test.TestSuite( {
		
		name: 'Date',
		
		
		items : [
		
			/*
			 * Test beforeSet()
			 */
			{
				name : "Test beforeSet()",
				
				
				"beforeSet() should return null when provided invalid values" : function() {
					var mockModel = JsMockito.mock( Model ),
					    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
					    oldValue,  // undefined
					    value;
					
					// Test with undefined and null
					value = attribute.beforeSet( mockModel, undefined, oldValue );
					Y.Assert.isNull( value, "Test with value: undefined" );
					
					value = attribute.beforeSet( mockModel, null, oldValue );
					Y.Assert.isNull( value, "Test with value: null" );
					
					
					// Test with booleans
					value = attribute.beforeSet( mockModel, false, oldValue );
					Y.Assert.isNull( value, "Test with value: false" );
					
					value = attribute.beforeSet( mockModel, true, oldValue );
					Y.Assert.isNull( value, "Test with value: true" );
										
					
					// Test with invalid strings
					value = attribute.beforeSet( mockModel, "", oldValue );
					Y.Assert.isNull( value, "Test with value: ''" );
					
					value = attribute.beforeSet( mockModel, "hi", oldValue );
					Y.Assert.isNull( value, "Test with value: 'hi'" );
					
					value = attribute.beforeSet( mockModel, "true", oldValue );
					Y.Assert.isNull( value, "Test with value: 'true'" );

					
					// Test with an object
					value = attribute.beforeSet( mockModel, {}, oldValue );
					Y.Assert.isNull( value, "Test with value: {}" );
					
					// Test with an array
					value = attribute.beforeSet( mockModel, [], oldValue );
					Y.Assert.isNull( value, "Test with value: []" );
				},
				
				
				"beforeSet() should return a Date object when provided valid values" : function() {
					var mockModel = JsMockito.mock( Model ),
					    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
					    oldValue,  // undefined
					    value;
					
					// Test with valid date strings
					value = attribute.beforeSet( mockModel, "2/22/2012", oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: '2/22/2012'" );
					
					// Test with numbers, which are taken to be the number of milliseconds since
					// the Unix epoch (1/1/1970)
					value = attribute.beforeSet( mockModel, 0, oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: 0" );

					value = attribute.beforeSet( mockModel, 1, oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: 1" );

					value = attribute.beforeSet( mockModel, 1000, oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: 1000" );
					
					// Test with strings that are numbers. These should be converted to a number
					// and assumed to be the number of milliseconds since the Unix epoch (1/1/1970)
					value = attribute.beforeSet( mockModel, "0", oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: '0'" );
					
					value = attribute.beforeSet( mockModel, "1000", oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: '1000'" );
					
					value = attribute.beforeSet( mockModel, "1000.00", oldValue );
					Y.Assert.isInstanceOf( Date, value, "Test with value: '1000.00'" );
					
					
					// Test with a Date object
					var date = new Date( "2/22/2012" );
					value = attribute.beforeSet( mockModel, date, oldValue );
					Y.Assert.areSame( date, value, "Test with actual Date object" );
				}
			}
		]
	
	
	} ) );
} );