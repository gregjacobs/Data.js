/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/attribute/Object',
	'data/Model'
], function( ObjectAttribute, Model ) {
	
	describe( "unit.attribute.data.attribute.Object", function() {
		
		describe( "Test the defaultValue", function() {
			
			it( "The default defaultValue for Object Attribute should be null", function() {
				expect( ObjectAttribute.prototype.defaultValue ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test beforeSet()", function() {
			
			it( "beforeSet() should return null when provided any falsy value, or non-object", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new ObjectAttribute( { name: 'attr' } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( null );
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( null );
			} );
			
			
			it( "beforeSet() should return an object unchanged", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new ObjectAttribute( { name: 'attr' } ),
				    oldValue;  // undefined
				
				var data = { attr1: 1, attr2: 2 };
				var value = attribute.beforeSet( mockModel, data, oldValue );
				
				expect( value ).toBe( data );
			} );
			
		} );
		
	} );
} );