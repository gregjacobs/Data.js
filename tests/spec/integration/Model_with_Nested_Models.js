/*global define, window, describe, beforeEach, afterEach, it, xit, expect */
define( [
	'lodash',
	'data/Model'
], function( _, Model ) {
	
	describe( "Integration: Model with Nested Models", function() {
		
		describe( "Test setting nested Models", function() {
			
			it( "set() should only change the attribute that a nested Model is being set to if it is a different model than it already has", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name: 'nestedModel', type: 'model' }
					]
				} );
				var NestedModel = Model.extend( {
					attributes : [ 'attr1', 'attr2' ]
				} );
				
				var model = new MyModel();
				var nestedModel1 = new NestedModel();
				var nestedModel2 = new NestedModel();
				
				
				// Add event handlers to determine when actual "sets" have been done
				var setCount = 0;
				model.addListener( 'change:nestedModel', function() { setCount++; } );
				
				// Add random subscriptions to nestedModel events, just to make sure this doesn't cause an issue.
				// (Using the old method of simply deep comparing the old object and the new object, which was unaware of 
				// nested Models, this would cause a "maximum call stack size exceeded" error on set())
				nestedModel1.on( 'change:attr1', function(){} );
				nestedModel2.on( 'change:attr1', function(){} );
				
				
				// Set for the first time
				model.set( 'nestedModel', nestedModel1 );
				expect( setCount ).toBe( 1 );  // orig YUI Test err msg: "The model should have been set for the first time"
				
				// Now set the model the second time. Should *not* fire a change event
				model.set( 'nestedModel', nestedModel1 );
				expect( setCount ).toBe( 1 );  // orig YUI Test err msg: "The model should not have been re-set, because it is the same model that is already there"
				
				
				// Set the second nestedModel now
				model.set( 'nestedModel', nestedModel2 );
				expect( setCount ).toBe( 2 );  // orig YUI Test err msg: "The new model (nestedModel2) should have been set"
				
				// Now set the second model the second time. Should *not* fire a change event
				model.set( 'nestedModel', nestedModel2 );
				expect( setCount ).toBe( 2 );  // orig YUI Test err msg: "The new model (nestedModel2) should not have been re-set, because it is the same model that is already there"
				
				
				// Set to null, to make sure we accept models again afterwards
				model.set( 'nestedModel', null );
				expect( setCount ).toBe( 3 );  // orig YUI Test err msg: "The attribute should have been set to null"
				
				// Now set to a model again
				model.set( 'nestedModel', nestedModel1 );
				expect( setCount ).toBe( 4 );  // orig YUI Test err msg: "The attribute should have been set to nestedModel1 after it had been null"
			} );
			
		} );
		
		
		describe( "Test the 'change' event for nested models", function() {
			
			xit( "When an attribute has changed in a nested model, its parent model should fire the appropriate 'change' events", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'child', type: 'model' }
					]
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr' }
					]
				} );
				
				var childModel = new ChildModel();
				var parentModel = new ParentModel( {
					child: childModel
				} );
				
				
				// A class to store the results
				var ChangeEventResults = function( model, attributeName, newValue, oldValue ) {
					this.model = model;
					this.attributeName = attributeName;
					this.newValue = newValue;
					this.oldValue = oldValue;
				};
				
				
				// Subscribe to the general 'change' event
				var parentGeneralChangeEventCount = 0,
				    parentGeneralChange;
				    
				parentModel.on( 'change', function( model, attributeName, newValue, oldValue ) {
					parentGeneralChangeEventCount++;
					parentGeneralChange = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// We should also be able to subscribe to the general (but child model-specific) 'change' event for the embedded model itself
				var generalModelSpecificChangeEventCount = 0,
				    generalModelSpecificChange;
				    
				parentModel.on( 'change:child', function( model, newValue, oldValue ) {
					generalModelSpecificChangeEventCount++;
					generalModelSpecificChange = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				// We should also be able to subscribe to the general (but child model-specific) 'change' event for attributes on the embedded model itself
				var generalModelSpecificAttrChangeEventCount = 0,
				    generalModelSpecificAttrChange;
				    
				parentModel.on( 'change:child.*', function( model, attributeName, newValue, oldValue ) {
					generalModelSpecificAttrChangeEventCount++;
					generalModelSpecificAttrChange = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// And finally, we should be able to subscribe to the attribute-specific 'change' event from the embedded model itself
				var attrSpecificChangeEventCount = 0,
				    attrSpecificChange;
				    
				parentModel.on( 'change:child.attr', function( model, newValue, oldValue ) {
					attrSpecificChangeEventCount++;
					attrSpecificChange = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				
				// Now set the value of the attribute in the child model
				childModel.set( 'attr', 'asdf' );
				
				// 'change'
				expect( parentGeneralChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The parent's general change event should have fired exactly once"
				expect( parentGeneralChange.model ).toBe( parentModel );  // orig YUI Test err msg: "The parent's general change event should have fired with the parent model"
				expect( parentGeneralChange.attributeName ).toBe( 'child' );  // orig YUI Test err msg: "The parent's general change event should have fired with attributeName for the childModel"
				expect( parentGeneralChange.newValue ).toBe( childModel );  // orig YUI Test err msg: "The parent's general change event should have fired with the new value"
				expect( parentGeneralChange.oldValue ).toBe( childModel );  // orig YUI Test err msg: "The parent's general change event should have fired with the old value"
				
				// 'change:child'
				expect( generalModelSpecificChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The childModel-specific change event should have fired exactly once"
				expect( generalModelSpecificChange.model ).toBe( parentModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the parent model"
				expect( generalModelSpecificChange.newValue ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the new value"
				expect( generalModelSpecificChange.oldValue ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the old value"
				
				// 'change:child.*'
				expect( generalModelSpecificAttrChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired exactly once"
				expect( generalModelSpecificAttrChange.model ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the child model"
				expect( generalModelSpecificAttrChange.attributeName ).toBe( 'attr' );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with attributeName of the changed attribute"
				expect( generalModelSpecificAttrChange.newValue ).toBe( 'asdf' );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the new value"
				expect( _.isUndefined( generalModelSpecificAttrChange.oldValue ) ).toBe( true );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the old value"
				
				// 'change:child.attr'
				expect( attrSpecificChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The attribute-specific change event should have fired exactly once"
				expect( attrSpecificChange.model ).toBe( childModel );  // orig YUI Test err msg: "The attribute-specific change event should have fired with the child model"
				expect( attrSpecificChange.newValue ).toBe( 'asdf' );  // orig YUI Test err msg: "The attribute-specific change event should have fired with the new value"
				expect( _.isUndefined( attrSpecificChange.oldValue ) ).toBe( true );  // orig YUI Test err msg: "The attribute-specific change event should have fired with the old value"
			} );
			
			
			xit( "The parent model should no longer fire events from the child model after the child model has been un-set from the parent", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'child', type: 'model', embedded: true }
					]
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr' }
					]
				} );
				
				var childModel = new ChildModel();
				var parentModel = new ParentModel( {
					child: childModel
				} );
				
				var attrChangeEventCount = 0;
				parentModel.on( 'change', function( model, attrName, newValue ) {
					attrChangeEventCount++;
				} );
				
				
				// Set a value in the child model. We should get a change event.
				childModel.set( 'attr', 'asdf' );
				
				expect( attrChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "while the child model is attached, the change event count should have increased by 1"
				
				
				// Now, unset the child model, and then set another attribute in it. We should not get another change event.
				parentModel.set( 'child', null );
				childModel.set( 'attr', 'asdf2' );
				
				expect( attrChangeEventCount ).toBe( 2 );  // orig YUI Test err msg: "We should only have 2 for the event firing count, as we un-set the child model from the parent (which is the +1), but then events on the childModel beyond that should not be counted"
			} );
			
			
			xit( "When an attribute has changed in a deeply nested model, its parent model should fire a 'change' event", function() {
				var ParentModel = Model.extend( {
					attributes : [
						{ name: 'intermediate', type: 'model' }
					],
					
					toString : function() { return "(ParentModel)"; }  // for debugging
				} );
				
				var IntermediateModel = Model.extend( {
					attributes : [
						{ name: 'child', type: 'model' }
					],
					
					toString : function() { return "(IntermediateModel)"; }  // for debugging
				} );
				
				var ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr' }
					],
					
					toString : function() { return "(ChildModel)"; }  // for debugging
				} );
				
				
				// Create the models 
				var parentModel = new ParentModel(),
				    intermediateModel = new IntermediateModel(),
				    childModel = new ChildModel();
				    
				parentModel.set( 'intermediate', intermediateModel );
				intermediateModel.set( 'child', childModel );
				
				
				
				// A class to store the results
				var ChangeEventResults = function( model, attributeName, newValue, oldValue ) {
					this.model = model;
					this.attributeName = attributeName;
					this.newValue = newValue;
					this.oldValue = oldValue;
				};
				
				
				// Subscribe to the general 'change' event
				var generalChangeEventCount = 0,
				    generalChange;
				    
				parentModel.on( 'change', function( model, attributeName, newValue, oldValue ) {
					generalChangeEventCount++;
					generalChange = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// We should also be able to subscribe to the general (but intermediate model-specific) 'change' event for the embedded model itself
				var intermediateModelChangeEventCount = 0,
				    intermediateModelChange;
				
				parentModel.on( 'change:intermediate', function( model, newValue, oldValue ) {
					intermediateModelChangeEventCount++;
					intermediateModelChange = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				// We should be able to subscribe to the attribute changes of the intermediate model
				var intermediateModelAttrChangeEventCount = 0,
				    intermediateModelAttrChange;
				
				parentModel.on( 'change:intermediate.*', function( model, attributeName, newValue, oldValue ) {
					intermediateModelAttrChangeEventCount++;
					intermediateModelAttrChange = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// We should be able to subscribe to the deeply nested (but childModel-specific) 'change' event
				var childModelChangeEventCount = 0,
				    childModelChange;
				
				parentModel.on( 'change:intermediate.child', function( model, newValue, oldValue ) {
					childModelChangeEventCount++;
					childModelChange = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				// We should be able to subscribe to the deeply nested (but childModel-specific) 'change' event for attributes
				var childModelChangeAttrEventCount = 0,
				    childModelChangeAttr;
				
				parentModel.on( 'change:intermediate.child.*', function( model, attributeName, newValue, oldValue ) {
					childModelChangeAttrEventCount++;
					childModelChangeAttr = new ChangeEventResults( model, attributeName, newValue, oldValue );
				} );
				
				
				// And finally, we should be able to subscribe to the attribute-specific 'change' event from the deeply embedded model itself
				var attrSpecificChangeEventCount = 0,
				    attrSpecificChange;
				    
				parentModel.on( 'change:intermediate.child.attr', function( model, newValue, oldValue ) {
					attrSpecificChangeEventCount++;
					attrSpecificChange = new ChangeEventResults( model, '', newValue, oldValue );
				} );
				
				
				// Now set the value of the attribute in the child model
				childModel.set( 'attr', 'asdf' );
				
				// 'change'
				expect( generalChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The general change event should have fired exactly once"
				expect( generalChange.model ).toBe( parentModel );  // orig YUI Test err msg: "The general change event should have fired with the parent model"
				expect( generalChange.attributeName ).toBe( 'intermediate' );  // orig YUI Test err msg: "The general change event should have fired with the attributeName as the intermediate model"
				expect( generalChange.newValue ).toBe( intermediateModel );  // orig YUI Test err msg: "The general change event should have fired with the intermediate model as the new value"
				expect( generalChange.oldValue ).toBe( intermediateModel );  // orig YUI Test err msg: "The general change event should have fired with the intermediate model as the old value"
				
				// 'change:intermediate'
				expect( intermediateModelChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The intermediateModel-specific change event should have fired exactly once"
				expect( intermediateModelChange.model ).toBe( parentModel );  // orig YUI Test err msg: "The intermediateModel-specific change event should have fired with the parent model"
				expect( intermediateModelChange.newValue ).toBe( intermediateModel );  // orig YUI Test err msg: "The intermediateModel-specific change event should have fired with the intermediate model as the new value"
				expect( intermediateModelChange.oldValue ).toBe( intermediateModel );  // orig YUI Test err msg: "The intermediateModel-specific change event should have fired with the intermediate model as the old value"
				
				// 'change:intermediate.*'
				expect( intermediateModelAttrChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The intermediateModel-specific attribute change event should have fired exactly once"
				expect( intermediateModelAttrChange.model ).toBe( intermediateModel );  // orig YUI Test err msg: "The intermediateModel-specific attribute change event should have fired with the intermediateModel"
				expect( intermediateModelAttrChange.attributeName ).toBe( 'child' );  // orig YUI Test err msg: "The intermediateModel-specific attribute change event should have fired with the child model attribute name"
				expect( intermediateModelAttrChange.newValue ).toBe( childModel );  // orig YUI Test err msg: "The intermediateModel-specific attribute change event should have fired with the childModel as the new value"
				expect( intermediateModelAttrChange.oldValue ).toBe( childModel );  // orig YUI Test err msg: "The intermediateModel-specific attribute change event should have fired with the childModel as the old value"
				
				// 'change:intermediate.child'
				expect( childModelChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The childModel-specific change event should have fired exactly once"
				expect( childModelChange.model ).toBe( intermediateModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the intermediateModel"
				expect( childModelChange.newValue ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the child model as the new value"
				expect( childModelChange.oldValue ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific change event should have fired with the child model as the old value"
				
				// 'change:intermediate.child.*'
				expect( childModelChangeAttrEventCount ).toBe( 1 );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired exactly once"
				expect( childModelChangeAttr.model ).toBe( childModel );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the childModel"
				expect( childModelChangeAttr.attributeName ).toBe( 'attr' );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the child model"
				expect( childModelChangeAttr.newValue ).toBe( 'asdf' );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the new value"
				expect( _.isUndefined( childModelChangeAttr.oldValue ) ).toBe( true );  // orig YUI Test err msg: "The childModel-specific attribute change event should have fired with the old value"
				
				// 'change:intermediate.child.attr'
				expect( attrSpecificChangeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The childModel attribute-specific change event should have fired exactly once"
				expect( attrSpecificChange.model ).toBe( childModel );  // orig YUI Test err msg: "The childModel attribute-specific change event should have fired with the childModel"
				expect( attrSpecificChange.newValue ).toBe( 'asdf' );  // orig YUI Test err msg: "The childModel attribute-specific change event should have fired with the new value"
				expect( _.isUndefined( attrSpecificChange.oldValue ) ).toBe( true );  // orig YUI Test err msg: "The childModel attribute-specific change event should have fired with the old value"
			} );
			
		} );
		
		
		describe( "Test that the parent model \"has changes\" (is modified) when an embedded model is changed", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.ParentWithEmbeddedChildModel = Model.extend( {
					attributes : [
						{ name: 'child', type: 'model', embedded: true }
					]
				} );
				
				thisSuite.ParentWithNonEmbeddedChildModel = Model.extend( {
					attributes : [
						{ name: 'child', type: 'model', embedded: false }  // Note: *not* embedded 
					]
				} );
				
				thisSuite.ChildModel = Model.extend( {
					attributes : [
						{ name : 'attr', type: 'string' },
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false }
					]
				} );
			} );
			
			
			it( "The parent model should have changes when a child embedded model has changes", function() {
				var childModel = new thisSuite.ChildModel();
				var parentModel = new thisSuite.ParentWithEmbeddedChildModel( {
					child: childModel
				} );
				
				childModel.set( 'attr', 'newValue' );
				expect( childModel.isModified() ).toBe( true );  // orig YUI Test err msg: "As a base test, the child model should be considered 'modified'"
				expect( parentModel.isModified() ).toBe( true );  // orig YUI Test err msg: "The parent model should be considered 'modified' while its child model is 'modified'"
				expect( parentModel.isModified( 'child' ) ).toBe( true );  // orig YUI Test err msg: "The 'child' attribute should be considered 'modified'"
			} );
			
			
			it( "The parent model should *not* have changes when a child model has changes, but is not 'embedded'", function() {
				var childModel = new thisSuite.ChildModel();
				var parentModel = new thisSuite.ParentWithNonEmbeddedChildModel( {
					child: childModel
				} );
				
				childModel.set( 'attr', 'newValue' );
				expect( parentModel.isModified() ).toBe( false );  // orig YUI Test err msg: "The parent model should not be considered 'modified' even though its child model is 'modified', because the child is not 'embedded'"
			} );
			
			
			it( "Using the persistedOnly option, the parent model should be considered modified if an embedded child model has a persisted attribute change", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persisted',
					unpersistedAttr: 'unpersisted'
				} );
				var parentModel = new thisSuite.ParentWithEmbeddedChildModel( {
					child: childModel
				} );
				childModel.set( 'persistedAttr', 'newValue' );
				
				expect( parentModel.isModified( { persistedOnly: true } ) ).toBe( true );  // orig YUI Test err msg: "The parent model should be considered modified because its child model has a change on a persisted attribute"
			} );
			
			
			it( "Using the persistedOnly option, the parent model should *not* be considered modified if an embedded child model only has unpersisted attribute changes", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persisted',
					unpersistedAttr: 'unpersisted'
				} );
				var parentModel = new thisSuite.ParentWithEmbeddedChildModel( {
					child: childModel
				} );
				childModel.set( 'unpersistedAttr', 'newValue' );
				
				expect( parentModel.isModified( { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "The parent model should *not* be considered modified because its child model only has a change on an unpersisted attribute"
			} );
			
			
			it( "Using the persistedOnly option and providing a specific attribute, the parent model should be considered modified if an embedded child model has a persisted attribute change", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persisted',
					unpersistedAttr: 'unpersisted'
				} );
				var parentModel = new thisSuite.ParentWithEmbeddedChildModel( {
					child: childModel
				} );
				childModel.set( 'persistedAttr', 'newValue' );
				
				expect( parentModel.isModified( 'child', { persistedOnly: true } ) ).toBe( true );  // orig YUI Test err msg: "The parent model should be considered modified because its child model has a change on a persisted attribute"
			} );
			
			
			it( "Using the persistedOnly option and providing a specific attribute, the parent model should *not* be considered modified if an embedded child model only has unpersisted attribute changes", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persisted',
					unpersistedAttr: 'unpersisted'
				} );
				var parentModel = new thisSuite.ParentWithEmbeddedChildModel( {
					child: childModel
				} );
				childModel.set( 'unpersistedAttr', 'newValue' );
				
				expect( parentModel.isModified( 'child', { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "The parent model should *not* be considered modified because its child model only has a change on an unpersisted attribute"
			} );
			
		} );
		
		
		describe( "Test getting changes from a parent model when an embedded model is changed", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.ParentModel = Model.extend( {
					attributes : [
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
			
			
			it( "A child model with changes should be retrieved (with all of its data, because it is embedded) when any of its attributes has a change", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persistedValue',
					unpersistedAttr: 'unpersistedValue' 
				} );
				var parentModel = new thisSuite.ParentModel( {
					child: childModel
				} );
				
				expect( _.keys( parentModel.getChanges() ).length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: there should be no changes"
				
				childModel.set( 'persistedAttr', 'newPersistedValue' );
				
				var changes = parentModel.getChanges();
				expect( _.keys( changes ).length ).toBe( 1 );  // orig YUI Test err msg: "There should be 1 property in the 'changes' object"
				expect( changes.hasOwnProperty( 'child' ) ).toBe( true );  // orig YUI Test err msg: "'child' should be the property in the 'changes' object"
				
				expect( _.keys( changes.child ).length ).toBe( 2 );  // orig YUI Test err msg: "There should be 2 properties in the 'child' changes object"
				expect( changes.child.persistedAttr ).toBe( 'newPersistedValue' );  // orig YUI Test err msg: "persistedAttr should exist in the 'child' changes, with the new value"
				expect( changes.child.unpersistedAttr ).toBe( 'unpersistedValue' );  // orig YUI Test err msg: "unpersistedAttr should exist in the 'child' changes, with its original value"
			} );
			
			
			it( "With the 'persistedOnly' option, a child model with changes should only be retrieved (with all of its persisted data, because it is embedded) when any of its *persisted* attributes has a change", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persistedValue',
					unpersistedAttr: 'unpersistedValue' 
				} );
				var parentModel = new thisSuite.ParentModel( {
					child: childModel
				} );
				
				expect( _.keys( parentModel.getChanges() ).length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: there should be no changes"
				
				childModel.set( 'persistedAttr', 'newPersistedValue' );
				
				var changes = parentModel.getChanges( { persistedOnly: true } );
				expect( _.keys( changes ).length ).toBe( 1 );  // orig YUI Test err msg: "There should be 1 property in the 'changes' object"
				expect( changes.hasOwnProperty( 'child' ) ).toBe( true );  // orig YUI Test err msg: "'child' should be the property in the 'changes' object"
				
				expect( _.keys( changes.child ).length ).toBe( 1 );  // orig YUI Test err msg: "There should be only 1 property (for the persisted one) in the 'child' changes object"
				expect( changes.child.persistedAttr ).toBe( 'newPersistedValue' );  // orig YUI Test err msg: "persistedAttr should exist in the 'child' changes, with the new value"
			} );
			
			
			it( "With the 'persistedOnly' option, a child model that only has changes to non-persisted attributes should *not* be retrieved with getChanges()", function() {
				var childModel = new thisSuite.ChildModel( {
					persistedAttr: 'persistedValue',
					unpersistedAttr: 'unpersistedValue' 
				} );
				var parentModel = new thisSuite.ParentModel( {
					child: childModel
				} );
				
				expect( _.keys( parentModel.getChanges() ).length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: there should be no changes"
				
				childModel.set( 'unpersistedAttr', 'newUnpersistedValue' );
				
				var changes = parentModel.getChanges( { persistedOnly: true } );
				expect( _.keys( changes ).length ).toBe( 0 );  // orig YUI Test err msg: "There should be no properties in the 'changes' object"
			} );
			
		} );
		
	} );
} );