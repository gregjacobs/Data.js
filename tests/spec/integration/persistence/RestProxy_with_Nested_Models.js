/*global define, window, describe, xdescribe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	'data/Model',
	'data/persistence/proxy/Rest',
	'data/persistence/request/Update'
], function( _, Model, RestProxy, UpdateRequest ) {

	// NOTE: TESTS ARE IGNORED. REST PROXY NEEDS PROPER IMPLEMENTATION
	xdescribe( "Integration: persistence.RestProxy with Nested Models", function() {
		
		describe( "Test updating when nested model attributes are changed", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				// A RestProxy subclass used for testing
				thisSuite.ajaxCallCount = 0;
				thisSuite.RestProxy = RestProxy.extend( {
					ajax : _.bind( function() { 
						thisSuite.ajaxCallCount++; 
						return {};  // just an anonymous "ajax" object 
					}, this )
				} );
				
				thisSuite.ParentModel = Model.extend( {
					attributes : [
						{ name: 'id', type: 'string' },
						{ name: 'child', type: 'model', embedded: true }
					]
				} );
				
				thisSuite.ChildModel = Model.extend( {
					attributes : [
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false }
					]
				} );
			} );
			
			
			it( "The parent model should *not* be persisted when only a non-persisted attribute of a nested model is changed", function() {
				var childModel = new thisSuite.ChildModel();
				var parentModel = new thisSuite.ParentModel( {
					id: 1,
					child: childModel
				} );
				childModel.set( 'unpersistedAttr', 'newValue' );
				
				var proxy = new thisSuite.RestProxy(),
				    request = new UpdateRequest( { models: [ parentModel ] } );
				
				proxy.update( request );
				
				expect( 0 ).toBe( thisSuite.ajaxCallCount );  // orig YUI Test err msg: "The update() method should not have made an ajax request, because there should have been nothing to persist"
			} );
			
		} );
		
	} );
	
} );