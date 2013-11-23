/*global define, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/attribute/Boolean'
], function( Model, BooleanAttribute ) {
	
	describe( "data.attribute.Boolean", function() {
		
		describe( 'getDefaultValue()', function() {
			
			it( "getDefaultValue() should return false in the default case (i.e. when the `useNull` config is false)", function() {
				var attribute = new BooleanAttribute( { name: 'attr', useNull: false } );
				
				expect( attribute.getDefaultValue() ).toBe( false );
			} );
			
			
			it( "getDefaultValue() should return null when the `useNull` config is true", function() {
				var attribute = new BooleanAttribute( { name: 'attr', useNull: true } );
				
				expect( attribute.getDefaultValue() ).toBe( null );
			} );
			
		} );
		
		
		describe( 'convert()', function() {
			
			it( "should return the appropriate Boolean when provided a range of values and types, when the useNull config is false", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new BooleanAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.convert( null );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with actual booleans
				value = attribute.convert( false );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.convert( true );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.convert( 1 );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				
				// Test with strings
				value = attribute.convert( "" );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.convert( "true" );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"				
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "should return null for 'unparsable' values/types, when the useNull config is true", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new BooleanAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.convert( null );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with actual booleans
				value = attribute.convert( false );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.convert( true );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.convert( 1 );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				
				// Test with strings
				value = attribute.convert( "" );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.convert( "true" );
				expect( value ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"				
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( value ).toBe( false );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
		} );
		
	} );
} );