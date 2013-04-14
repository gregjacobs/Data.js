/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/attribute/Boolean'
], function( Model, BooleanAttribute ) {
	
	describe( "unit.attribute.Boolean", function() {
		
		describe( "Test getDefaultValue()", function() {
			
			it( "getDefaultValue() should return false in the default case (i.e. when the `useNull` config is false)", function() {
				var attribute = new BooleanAttribute( { name: 'attr', useNull: false } );
				
				expect( attribute.getDefaultValue() ).toBe( false );
			} );
			
			
			it( "getDefaultValue() should return null when the `useNull` config is true", function() {
				var attribute = new BooleanAttribute( { name: 'attr', useNull: true } );
				
				expect( attribute.getDefaultValue() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test beforeSet()", function() {
			
			it( "beforeSet() should return the appropriate Boolean when provided a range of values and types, when the useNull config is false", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new BooleanAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with actual booleans
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				
				// Test with strings
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.beforeSet( mockModel, "true", oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"				
				
				
				// Test with an object
				value = attribute.beforeSet( mockModel, {}, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "beforeSet() should return null for 'unparsable' values/types, when the useNull config is true", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new BooleanAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with actual booleans
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				
				// Test with strings
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.beforeSet( mockModel, "true", oldValue );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"				
				
				
				// Test with an object
				value = attribute.beforeSet( mockModel, {}, oldValue );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
		} );
		
	} );
} );