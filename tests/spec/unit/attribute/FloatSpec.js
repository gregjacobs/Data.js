/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/attribute/Float',
	'data/Model'
], function( FloatAttribute, Model ) {

	describe( "unit.attribute.Float", function() {
		
		describe( "Test getDefaultValue()", function() {
			
			it( "getDefaultValue() should return 0 in the default case (i.e. when the `useNull` config is false)", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: false } );
				
				expect( attribute.getDefaultValue() ).toBe( 0 );
			} );
			
			
			it( "getDefaultValue() should return null when the `useNull` config is true", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: true } );
				
				expect( attribute.getDefaultValue() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test beforeSet()", function() {
			
			it( "beforeSet() should return the appropriate string value when provided a range of values and types, when the useNull config is false", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.beforeSet( mockModel, 1.42, oldValue );
				expect( value ).toBe( 1.42 );  // orig YUI Test err msg: "Test with value: 1.42"
				
				
				// Test with actual strings
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.beforeSet( mockModel, "true", oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"
				
				value = attribute.beforeSet( mockModel, "1", oldValue );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: '1'"
				
				value = attribute.beforeSet( mockModel, "1.11", oldValue );
				expect( value ).toBe( 1.11 );  // orig YUI Test err msg: "Test with value: '1.11'"	
				
				
				// Test with an object
				value = attribute.beforeSet( mockModel, {}, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "beforeSet() should return null for 'unparsable' values/types, when the useNull config is true", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.beforeSet( mockModel, 1.42, oldValue );
				expect( value ).toBe( 1.42 );  // orig YUI Test err msg: "Test with value: 1.42"
				
				
				// Test with actual strings
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.beforeSet( mockModel, "true", oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"
				
				value = attribute.beforeSet( mockModel, "1", oldValue );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: '1'"
				
				value = attribute.beforeSet( mockModel, "1.11", oldValue );
				expect( value ).toBe( 1.11 );  // orig YUI Test err msg: "Test with value: '1.11'"
				
				
				// Test with an object
				value = attribute.beforeSet( mockModel, {}, oldValue );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "beforeSet() should strip off $, %, and comma (',') characters from an input string, to make a float", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.beforeSet( mockModel, "$1,000.32%", oldValue );
				expect( value ).toBe( 1000.32 );  // orig YUI Test err msg: "Test with value: $1,000.32%"
			} );
			
		} );
		
	} );
} );