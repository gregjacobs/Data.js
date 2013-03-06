/*global define, Ext, Y, JsMockito, tests */
define( [
	'data/attribute/Object',
	'data/Model'
], function( ObjectAttribute, Model ) {
	
	tests.unit.attribute.add( new Ext.test.TestSuite( {
		
		name: 'Data.attribute.Object',
		
		
		items : [
		
			/*
			 * Test the defaultValue
			 */
			{
				name : "Test the defaultValue",
				
				"The default defaultValue for Object Attribute should be null" : function() {
					Y.Assert.isNull( ObjectAttribute.prototype.defaultValue );
				}
			},
		
			
			/*
			 * Test beforeSet()
			 */
			{
				name : "Test beforeSet()",
				
				
				"beforeSet() should return null when provided any falsy value, or non-object" : function() {
					var mockModel = JsMockito.mock( Model ),
					    attribute = new ObjectAttribute( { name: 'attr' } ),
					    oldValue,  // undefined
					    value;
					
					value = attribute.beforeSet( mockModel, 0, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, 1, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, "", oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, "hi", oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, false, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, true, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, undefined, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, null, oldValue );
					Y.Assert.areSame( null, value );
				},
				
				
				
				"beforeSet() should return an object unchanged" : function() {
					var mockModel = JsMockito.mock( Model ),
					    attribute = new ObjectAttribute( { name: 'attr' } ),
					    oldValue;  // undefined
					
					var data = { attr1: 1, attr2: 2 };
					var value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.areSame( data, value );
				}
			}
			
		]
		
	} ) );
} );