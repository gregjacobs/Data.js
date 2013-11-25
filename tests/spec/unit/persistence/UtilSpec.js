/*global define, describe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	'data/persistence/Util'
], function( _, PersistenceUtil ) {
	
	describe( 'data.persistence.Util', function() {
		
		describe( 'normalizePeristenceOptions()', function() {
			var optionsProperties = [ 'success', 'error', 'cancel', 'progress', 'complete' ];
			
			it( "should return an object with the defaults filled in if `undefined` is passed to it", function() {
				var options = PersistenceUtil.normalizePersistenceOptions( undefined );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return an object with the defaults filled in if `null` is passed to it", function() {
				var options = PersistenceUtil.normalizePersistenceOptions( null );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return an object with the defaults filled in if an empty object is passed to it", function() {
				var options = PersistenceUtil.normalizePersistenceOptions( {} );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return the same object that was passed into it, populating the object instead of creating a new one", function() {
				var inputOptionsObj = {},
				    options = PersistenceUtil.normalizePersistenceOptions( inputOptionsObj );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
				
				// Check that the method returned the same object that was passed in
				expect( options ).toBe( inputOptionsObj );
			} );
			
			
			it( "should bind the `scope` to each of the provided functions", function() {
				var successScope, errorScope, cancelScope, progressScope, completeScope,
				    scopeObj = {};
				
				var options = PersistenceUtil.normalizePersistenceOptions( {
					success  : function() { successScope = this; },
					error    : function() { errorScope = this; },
					cancel   : function() { cancelScope = this; },
					progress : function() { progressScope = this; },
					complete : function() { completeScope = this; },
					
					scope : scopeObj
				} );
				
				// Execute each callback, and see if they were executed in the correct scope
				_.forEach( optionsProperties, function( prop ) { options[ prop ](); } );
				
				expect( successScope ).toBe( scopeObj );
				expect( errorScope ).toBe( scopeObj );
				expect( cancelScope ).toBe( scopeObj );
				expect( progressScope ).toBe( scopeObj );
				expect( completeScope ).toBe( scopeObj );
			} );
			
			
			it( "should bind the `context` to each of the provided functions, as an alternative to using `scope`", function() {
				var successScope, errorScope, cancelScope, progressScope, completeScope,
				    contextObj = {};
				
				var options = PersistenceUtil.normalizePersistenceOptions( {
					success  : function() { successScope = this; },
					error    : function() { errorScope = this; },
					cancel   : function() { cancelScope = this; },
					progress : function() { progressScope = this; },
					complete : function() { completeScope = this; },
					
					context : contextObj
				} );
				
				// Execute each callback, and see if they were executed in the correct scope
				_.forEach( optionsProperties, function( prop ) { options[ prop ](); } );
				
				expect( successScope ).toBe( contextObj );
				expect( errorScope ).toBe( contextObj );
				expect( cancelScope ).toBe( contextObj );
				expect( progressScope ).toBe( contextObj );
				expect( completeScope ).toBe( contextObj );
			} );
			
		} );
		
	} );
	
} );