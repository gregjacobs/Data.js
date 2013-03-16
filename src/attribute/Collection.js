/*global define */
/*jshint newcap:false */  // For the dynamic constructor: new collectionClass( ... );
define( [
	'require',
	'lodash',
	'Class',
	'data/attribute/Attribute',
	'data/attribute/DataComponent',
	'data/Collection'  // circular dependency, not included in args list
], function( require, _, Class, Attribute, DataComponentAttribute ) {
	
	/**
	 * @class data.attribute.Collection
	 * @extends data.attribute.DataComponent
	 * 
	 * Attribute definition class for an Attribute that allows for a nested {@link data.Collection} value.
	 * 
	 * This class enforces that the Attribute hold a {@link data.Collection Collection} value, or null. However, it will
	 * automatically convert an array of {@link data.Model models} or anonymous data objects into the appropriate 
	 * {@link data.Collection Collection} subclass, using the Collection provided to the {@link #collectionClass} config.
	 * Anonymous data objects in this array will be converted to the model type provided to the collection's 
	 * {@link data.Collection#model}. 
	 * 
	 * Otherwise, you must either provide a {@link data.Collection} subclass as the value, or use a custom {@link #cfg-set} 
	 * function to convert any anonymous array to a Collection in the appropriate way. 
	 */
	var CollectionAttribute = Class.extend( DataComponentAttribute, {
			
		/**
		 * @cfg {Array/data.Collection} defaultValue
		 * @inheritdoc
		 * 
		 * Defaults to an empty array, to create an empty Collection of the given {@link #collectionClass} type.
		 */
		//defaultValue : [],  -- Not yet fully implemented on a general level. Can use this in code though.
		
		/**
		 * @cfg {data.Collection/String/Function} collectionClass (required)
		 * The specific {@link data.Collection} subclass that will be used in the Collection Attribute. This config is needed
		 * to perform automatic conversion of an array of models / anonymous data objects into the approperiate Collection subclass.
		 * 
		 * This config may be provided as:
		 * 
		 * - A direct reference to a Collection (ex: `myApp.collections.MyCollection`),
		 * - A String which specifies the object path to the Collection (which must be able to be referenced from the global scope, 
		 *   ex: 'myApp.collections.MyCollection'),
		 * - Or a function, which will return a reference to the Collection that should be used. 
		 * 
		 * The reason that this config may be specified as a String or a Function is to allow for late binding to the Collection class 
		 * that is used, where the Collection class that is to be used does not have to exist in the source code until a value is 
		 * actually set to the Attribute. This allows for the handling of circular dependencies as well.
		 */
		
		/**
		 * @cfg {Boolean} embedded
		 * Setting this config to true has the parent {@link data.Model Model} treat the child {@link data.Collection Collection} as if it is 
		 * a part of itself. Normally, a child Collection that is not embedded is treated as a "relation", where it is considered as independent 
		 * from the parent Model.
		 * 
		 * What this means is that, when true:
		 * 
		 * - The parent Model is considered as "changed" when a model in the child Collection is changed, or one has been added/removed. This Attribute 
		 *   (the attribute that holds the child collection) is the "change".
		 * - The parent Model's {@link data.Model#change change} event is fired when a model on the child Collection has changed, or one has 
		 *   been added/removed.
		 * - The child Collection's model data is persisted with the parent Collection's data, unless the {@link #persistIdOnly} config is set to true,
		 *   in which case just the child Collection's models' {@link data.Model#idAttribute ids} are persisted with the parent Model.
		 */
		embedded : false,
		
		/**
		 * @cfg {Boolean} persistIdOnly
		 * In the case that the {@link #embedded} config is true, set this to true to only have the {@link data.Model#idAttribute id} of the embedded 
		 * collection's models be persisted, rather than all of the collection's model data. Normally, when {@link #embedded} is false (the default), 
		 * the child {@link data.Collection Collection} is treated as a relation, and only its model's {@link data.Model#idAttribute ids} are persisted.
		 */
		persistIdOnly : false,
		
		
		// -------------------------------
		
		
		constructor : function() {
			this._super( arguments );
			
			// Check if the user did not provide a collectionClass, or the value is undefined (which means that they specified
			// a class that either doesn't exist, or doesn't exist yet, and we should give them an error to alert them).
			// <debug>
			if( 'collectionClass' in this && this.collectionClass === undefined ) {
				throw new Error( "The 'collectionClass' config provided to an Attribute with the name '" + this.getName() + "' either doesn't exist, or doesn't " +
				                 "exist just yet. Consider using the String or Function form of the collectionClass config for late binding, if needed" );
			}
			// </debug>
		},
		
		
		/**
		 * Overridden method used to determine if two collections are equal.
		 * @inheritdoc
		 * 
		 * @override
		 * @method valuesAreEqual
		 * @param {Mixed} oldValue
		 * @param {Mixed} newValue
		 * @return {Boolean} True if the values are equal, and the Model should *not* consider the new value as a 
		 *   change of the old value, or false if the values are different, and the new value should be taken as a change.
		 */
		valuesAreEqual : function( oldValue, newValue ) {
			// If the references are the same, they are equal. Many collections can be made to hold the same models.
			return oldValue === newValue;
		},
		
		
		/**
		 * Overridden `beforeSet` method used to convert any arrays into the specified {@link #collectionClass}. The array
		 * will be provided to the {@link #collectionClass collectionClass's} constructor.
		 * 
		 * @override
		 * @method beforeSet
		 * @inheritdoc
		 */
		beforeSet : function( model, newValue, oldValue ) {
			// Now, normalize the newValue to an object, or null
			newValue = this._super( arguments );
			
			var Collection = require( 'data/Collection' );
			if( newValue !== null ) {
				var collectionClass = this.collectionClass;
				
				// Normalize the collectionClass
				if( typeof collectionClass === 'string' ) {
					collectionClass = this.resolveGlobalPath( collectionClass );  // changes the string "a.b.c" into the value at `window.a.b.c`
					
					if( !collectionClass ) {
						throw new Error( "The string value 'collectionClass' config did not resolve to a Collection class for attribute '" + this.getName() + "'" );
					}
				} else if( typeof collectionClass === 'function' && !Class.isSubclassOf( collectionClass, Collection ) ) {  // it's not a data.Collection subclass, so it must be an anonymous function. Run it, so it returns the Collection reference we need
					this.collectionClass = collectionClass = collectionClass();
					if( !collectionClass ) {
						throw new Error( "The function value 'collectionClass' config did not resolve to a Collection class for attribute '" + this.getName() + "'" );
					}
				}
				
				if( newValue && typeof collectionClass === 'function' && !( newValue instanceof collectionClass ) ) {
					newValue = new collectionClass( newValue );
				}
			}
			
			return newValue;
		},
		
		
		/**
		 * Overridden `afterSet` method used to subscribe to add/remove/change events on a set child {@link data.Collection Collection}.
		 * 
		 * @override
		 * @method afterSet
		 * @inheritdoc
		 */
		afterSet : function( model, value ) {
			var Collection = require( 'data/Collection' );
			
			// Enforce that the value is either null, or a data.Collection
			if( value !== null && !( value instanceof Collection ) ) {
				throw new Error( "A value set to the attribute '" + this.getName() + "' was not a data.Collection subclass" );
			}
			
			return value;
		}
		
	} );
	
	
	// Register the Attribute type
	Attribute.registerType( 'collection', CollectionAttribute );
	
	return CollectionAttribute;
	
} );